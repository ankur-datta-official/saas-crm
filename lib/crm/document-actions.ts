"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireOrganization } from "@/lib/auth/session";
import { getSafeErrorMessage, logServerError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { checkFileSizeLimit, checkStorageLimit } from "@/lib/subscription/subscription-queries";
import { documentSchema } from "@/lib/crm/schemas";
import { createNotification } from "@/lib/notifications/notifications";

async function insertActivityLog(action: string, entityType: string, entityId: string, metadata: Record<string, any> = {}) {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const supabase = await createClient();

  await supabase.from("activity_logs").insert({
    organization_id: organization.id,
    actor_user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}

export type DocumentActionState = {
  ok: boolean;
  error?: string;
  id?: string;
  fieldErrors?: Record<string, string>;
};

type AccessibleDocumentFile = {
  id: string;
  organization_id: string;
  company_id: string;
  file_path: string;
  file_name: string;
  file_size_mb: number | null;
  mime_type: string | null;
  file_extension: string | null;
};

function getValidationFailure(error: z.ZodError): DocumentActionState {
  return {
    ok: false,
    error: error.errors[0]?.message ?? "Please check the form and try again.",
    fieldErrors: Object.fromEntries(error.errors.map((issue) => [String(issue.path[0]), issue.message])),
  };
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

function sanitizeFileName(fileName: string) {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .trim();

  const fallback = cleaned || "document";
  return fallback.slice(0, 120);
}

function buildDocumentFilePath(organizationId: string, companyId: string, documentId: string, originalFileName: string) {
  const safeOrganizationId = sanitizePathSegment(organizationId);
  const safeCompanyId = sanitizePathSegment(companyId);
  const safeDocumentId = sanitizePathSegment(documentId);
  const safeFileName = sanitizeFileName(originalFileName);
  return `${safeOrganizationId}/${safeCompanyId}/${safeDocumentId}/${safeFileName}`;
}

function getStorageErrorMessage(error: { message?: string; statusCode?: string | number } | null | undefined) {
  const rawMessage = error?.message?.toLowerCase() ?? "";
  const statusCode = String(error?.statusCode ?? "");

  if (rawMessage.includes("bucket not found") || rawMessage.includes("not found") || statusCode === "404") {
    return "Storage bucket not found. Please create crm-documents bucket.";
  }

  if (rawMessage.includes("row-level security") || rawMessage.includes("permission denied") || rawMessage.includes("unauthorized") || statusCode === "403" || statusCode === "401") {
    return "You do not have permission to upload this document.";
  }

  if (rawMessage.includes("already exists") || rawMessage.includes("duplicate")) {
    return "A file with the same name already exists in this upload path. Please rename the file and try again.";
  }

  if (rawMessage.includes("invalid") || rawMessage.includes("path")) {
    return "Upload failed. Please try again.";
  }

  return "Upload failed. Please try again.";
}

async function cleanupUploadedFile(supabase: Awaited<ReturnType<typeof createClient>>, filePath: string) {
  const { error } = await supabase.storage.from("crm-documents").remove([filePath]);
  if (error) {
    logServerError("document.upload.cleanup_failed", error, { filePath });
  }
}

function getSignedUrlErrorMessage(error: { message?: string; statusCode?: string | number } | null | undefined) {
  const rawMessage = error?.message?.toLowerCase() ?? "";
  const statusCode = String(error?.statusCode ?? "");

  if (rawMessage.includes("bucket not found") || rawMessage.includes("not found") || statusCode === "404") {
    return "Storage bucket not found. Please create crm-documents bucket.";
  }

  if (rawMessage.includes("row-level security") || rawMessage.includes("permission denied") || rawMessage.includes("unauthorized") || statusCode === "403" || statusCode === "401") {
    return "You do not have permission to access this document.";
  }

  return "Unable to prepare this document. Please try again.";
}

async function validateDocumentOwnership(documentId: string): Promise<{ organization: Awaited<ReturnType<typeof requireOrganization>>; document: AccessibleDocumentFile }> {
  const organization = await requireOrganization();
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, organization_id, company_id, file_path, file_name, file_size_mb, mime_type, file_extension")
    .eq("id", documentId)
    .eq("organization_id", organization.id)
    .single();

  if (error || !document) {
    throw new Error("Document not found or access denied.");
  }

  return { organization, document };
}

async function createSignedDocumentUrl(documentId: string, expiresInSeconds = 900) {
  await requireAuth();
  const { document } = await validateDocumentOwnership(documentId);

  if (!document.file_path) {
    throw new Error("This document is missing its stored file path.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .storage
    .from("crm-documents")
    .createSignedUrl(document.file_path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    logServerError("document.signed_url", error ?? new Error("Signed URL was not returned."), {
      documentId,
      filePath: document.file_path,
      expiresInSeconds,
    });
    throw new Error(getSignedUrlErrorMessage(error));
  }

  return {
    signedUrl: data.signedUrl,
    fileName: document.file_name,
    mimeType: document.mime_type,
    fileExtension: document.file_extension,
    fileSizeMb: document.file_size_mb,
  };
}

export async function createDocument(formData: FormData): Promise<DocumentActionState> {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const supabase = await createClient();

  const maybeFile = formData.get("file");
  const file = maybeFile instanceof File ? maybeFile : null;
  if (!file || file.size <= 0) return { ok: false, error: "File is required." };

  const fileSizeLimit = await checkFileSizeLimit(file.size);
  if (!fileSizeLimit.allowed) {
    await insertActivityLog("subscription.limit_reached", "organization", organization.id, {
      limit_type: "file_size",
      projected: fileSizeLimit.projected,
      max: fileSizeLimit.max,
    });
    return { ok: false, error: "File is larger than your plan limit." };
  }

  const storageLimit = await checkStorageLimit(file.size / (1024 * 1024));
  if (!storageLimit.allowed) {
    await insertActivityLog("subscription.limit_reached", "organization", organization.id, {
      limit_type: "storage",
      current: storageLimit.current,
      projected: storageLimit.projected,
      max: storageLimit.max,
    });
    return { ok: false, error: storageLimit.message ?? "Document storage limit has been reached for your current plan." };
  }

  const rawValues = Object.fromEntries(formData.entries());
  const validated = documentSchema.safeParse(rawValues);

  if (!validated.success) {
    return getValidationFailure(validated.error);
  }

  const documentId = crypto.randomUUID();
  const safeFileName = sanitizeFileName(file.name);
  const fileExtension = safeFileName.includes(".") ? safeFileName.split(".").pop() : null;
  const filePath = buildDocumentFilePath(organization.id, validated.data.company_id, documentId, safeFileName);

  const { error: uploadError } = await supabase.storage
    .from("crm-documents")
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadError) {
    logServerError("document.upload.storage", uploadError, {
      organizationId: organization.id,
      companyId: validated.data.company_id,
      documentId,
      filePath,
      fileName: file.name,
      fileSize: file.size,
    });
    return { ok: false, error: getStorageErrorMessage(uploadError) };
  }

  const { error: dbError } = await supabase.from("documents").insert({
    id: documentId,
    organization_id: organization.id,
    ...validated.data,
    file_name: safeFileName,
    file_path: filePath,
    file_size_mb: Number((file.size / (1024 * 1024)).toFixed(2)),
    mime_type: file.type,
    file_extension: fileExtension,
    uploaded_by: user.id,
    created_by: user.id,
    updated_by: user.id,
  });

  if (dbError) {
    await cleanupUploadedFile(supabase, filePath);
    logServerError("document.upload.record", dbError, { organizationId: organization.id, documentId, companyId: validated.data.company_id });
    return { ok: false, error: getSafeErrorMessage(dbError, "The document was uploaded but could not be saved. Please try again.") };
  }

  await insertActivityLog("uploaded", "document", documentId, { title: validated.data.title });

  const { data: company } = await supabase
    .from("companies")
    .select("assigned_user_id, name")
    .eq("id", validated.data.company_id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (company?.assigned_user_id && company.assigned_user_id !== user.id) {
    await createNotification({
      userId: company.assigned_user_id,
      type: "document.uploaded",
      title: "New document uploaded",
      message: `A document was uploaded for ${company.name ?? "your assigned company"}: "${validated.data.title}".`,
      link: `/documents/${documentId}`,
    });
  }

  revalidatePath("/documents");
  revalidatePath(`/companies/${validated.data.company_id}`);

  return { ok: true, id: documentId };
}

export async function updateDocument(documentId: string, formData: FormData): Promise<DocumentActionState> {
  const user = await requireAuth();
  const { organization, document } = await validateDocumentOwnership(documentId);
  const supabase = await createClient();

  const rawValues = Object.fromEntries(formData.entries());
  const validated = documentSchema.safeParse(rawValues);

  if (!validated.success) {
    return getValidationFailure(validated.error);
  }

  const maybeFile = formData.get("file");
  const file = maybeFile instanceof File ? maybeFile : null;
  let filePath = document.file_path;
  let fileMetadata = {};

  if (file && file.size > 0) {
    const fileSizeLimit = await checkFileSizeLimit(file.size);
    if (!fileSizeLimit.allowed) {
      await insertActivityLog("subscription.limit_reached", "organization", organization.id, {
        limit_type: "file_size",
        projected: fileSizeLimit.projected,
        max: fileSizeLimit.max,
      });
      return { ok: false, error: "File is larger than your plan limit." };
    }

    const storageLimit = await checkStorageLimit(file.size / (1024 * 1024), Number(document.file_size_mb ?? 0));
    if (!storageLimit.allowed) {
      await insertActivityLog("subscription.limit_reached", "organization", organization.id, {
        limit_type: "storage",
        current: storageLimit.current,
        projected: storageLimit.projected,
        max: storageLimit.max,
      });
      return { ok: false, error: storageLimit.message ?? "Document storage limit has been reached for your current plan." };
    }

    const safeFileName = sanitizeFileName(file.name);
    const newFilePath = buildDocumentFilePath(organization.id, validated.data.company_id, documentId, safeFileName);
    
    const { error: uploadError } = await supabase.storage
      .from("crm-documents")
      .upload(newFilePath, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

    if (uploadError) {
      logServerError("document.update.storage", uploadError, {
        organizationId: organization.id,
        companyId: validated.data.company_id,
        documentId,
        oldFilePath: document.file_path,
        newFilePath,
        fileName: file.name,
        fileSize: file.size,
      });

      if (newFilePath === document.file_path && uploadError.message?.toLowerCase().includes("already exists")) {
        const { error: removeCurrentFileError } = await supabase.storage.from("crm-documents").remove([document.file_path]);
        if (removeCurrentFileError) {
          logServerError("document.update.remove_current_file_failed", removeCurrentFileError, {
            organizationId: organization.id,
            documentId,
            filePath: document.file_path,
          });
          return { ok: false, error: "Upload failed. Please try again." };
        }

        const retryUpload = await supabase.storage.from("crm-documents").upload(newFilePath, file, {
          upsert: false,
          contentType: file.type || undefined,
        });

        if (retryUpload.error) {
          logServerError("document.update.storage_retry", retryUpload.error, {
            organizationId: organization.id,
            documentId,
            newFilePath,
          });
          return { ok: false, error: getStorageErrorMessage(retryUpload.error) };
        }
      } else {
        return { ok: false, error: getStorageErrorMessage(uploadError) };
      }
    }

    if (newFilePath !== document.file_path) {
      const { error: removeOldFileError } = await supabase.storage.from("crm-documents").remove([document.file_path]);
      if (removeOldFileError) {
        logServerError("document.update.remove_old_file_failed", removeOldFileError, {
          organizationId: organization.id,
          documentId,
          filePath: document.file_path,
        });
      }
    }

    filePath = newFilePath;
    fileMetadata = {
      file_name: safeFileName,
      file_path: filePath,
      file_size_mb: Number((file.size / (1024 * 1024)).toFixed(2)),
      mime_type: file.type,
      file_extension: safeFileName.includes(".") ? safeFileName.split(".").pop() : null,
    };
    
    await insertActivityLog("file_replaced", "document", documentId, { title: validated.data.title });
  }

  const { error: dbError } = await supabase
    .from("documents")
    .update({
      ...validated.data,
      ...fileMetadata,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("organization_id", organization.id);

  if (dbError) {
    logServerError("document.update.record", dbError, {
      organizationId: organization.id,
      documentId,
      companyId: validated.data.company_id,
    });
    return { ok: false, error: dbError.message };
  }

  await insertActivityLog("updated", "document", documentId, { title: validated.data.title });

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);
  revalidatePath(`/companies/${validated.data.company_id}`);

  return { ok: true, id: documentId };
}

export async function archiveDocument(documentId: string): Promise<DocumentActionState> {
  const user = await requireAuth();
  const { organization } = await validateDocumentOwnership(documentId);
  const supabase = await createClient();

  const { error } = await supabase
    .from("documents")
    .update({
      status: "archived",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await insertActivityLog("archived", "document", documentId);

  revalidatePath("/documents");
  revalidatePath(`/documents/${documentId}`);

  return { ok: true };
}

export async function logDocumentDownload(documentId: string): Promise<void> {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const supabase = await createClient();

  await supabase.from("document_download_logs").insert({
    organization_id: organization.id,
    document_id: documentId,
    downloaded_by: user.id,
  });

  await insertActivityLog("downloaded", "document", documentId);
}

export async function getSignedDocumentDownloadUrl(documentId: string) {
  return createSignedDocumentUrl(documentId, 900);
}

export async function getSignedDocumentViewUrl(documentId: string) {
  return createSignedDocumentUrl(documentId, 900);
}

export async function deleteDocument(documentId: string): Promise<DocumentActionState> {
  const { organization, document } = await validateDocumentOwnership(documentId);
  const supabase = await createClient();

  // 1. Delete file from storage
  const { error: storageError } = await supabase.storage
    .from("crm-documents")
    .remove([document.file_path]);

  if (storageError) {
    logServerError("document.delete.storage", storageError, { organizationId: organization.id, documentId, filePath: document.file_path });
    return { ok: false, error: "Unable to remove the stored file. Please try again." };
  }

  // 2. Delete record from database
  const { error: dbError } = await supabase
    .from("documents")
    .delete()
    .eq("id", documentId)
    .eq("organization_id", organization.id);

  if (dbError) {
    return { ok: false, error: dbError.message };
  }

  revalidatePath("/documents");
  revalidatePath(`/companies/${document.company_id}`);

  return { ok: true };
}
