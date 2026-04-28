"use server";

import { revalidatePath } from "next/cache";
import { requireAuth, requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { checkFileSizeLimit, checkStorageLimit } from "@/lib/subscription/subscription-queries";
import { documentSchema } from "@/lib/crm/schemas";

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

async function validateDocumentOwnership(documentId: string) {
  const organization = await requireOrganization();
  const supabase = await createClient();

  const { data: document, error } = await supabase
    .from("documents")
    .select("id, organization_id, company_id, file_path, file_size_mb")
    .eq("id", documentId)
    .eq("organization_id", organization.id)
    .single();

  if (error || !document) {
    throw new Error("Document not found or access denied.");
  }

  return { organization, document };
}

export async function createDocument(formData: FormData): Promise<DocumentActionState> {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const supabase = await createClient();

  const file = formData.get("file") as File;
  if (!file) return { ok: false, error: "File is required." };

  const fileSizeLimit = await checkFileSizeLimit(file.size);
  if (!fileSizeLimit.allowed) {
    await insertActivityLog("subscription.limit_reached", "organization", organization.id, {
      limit_type: "file_size",
      projected: fileSizeLimit.projected,
      max: fileSizeLimit.max,
    });
    return { ok: false, error: fileSizeLimit.message ?? "The selected file is too large for your current plan." };
  }

  const storageLimit = await checkStorageLimit(file.size / (1024 * 1024));
  if (!storageLimit.allowed) {
    await insertActivityLog("subscription.limit_reached", "organization", organization.id, {
      limit_type: "storage",
      current: storageLimit.current,
      projected: storageLimit.projected,
      max: storageLimit.max,
    });
    return { ok: false, error: storageLimit.message ?? "Document storage limit reached for your current plan." };
  }

  const rawValues = Object.fromEntries(formData.entries());
  const validated = documentSchema.safeParse(rawValues);

  if (!validated.success) {
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: Object.fromEntries(
        validated.error.errors.map((e) => [e.path[0], e.message])
      ),
    };
  }

  const documentId = crypto.randomUUID();
  const fileExtension = file.name.split(".").pop();
  const filePath = `${organization.id}/${validated.data.company_id}/${documentId}/${file.name}`;

  // 1. Upload file to storage
  const { error: uploadError } = await supabase.storage
    .from("crm-documents")
    .upload(filePath, file);

  if (uploadError) {
    return { ok: false, error: `Upload failed: ${uploadError.message}` };
  }

  // 2. Insert record into database
  const { error: dbError } = await supabase.from("documents").insert({
    id: documentId,
    organization_id: organization.id,
    ...validated.data,
    file_name: file.name,
    file_path: filePath,
    file_size_mb: Number((file.size / (1024 * 1024)).toFixed(2)),
    mime_type: file.type,
    file_extension: fileExtension,
    uploaded_by: user.id,
    created_by: user.id,
    updated_by: user.id,
  });

  if (dbError) {
    // Cleanup file if DB insert fails
    await supabase.storage.from("crm-documents").remove([filePath]);
    return { ok: false, error: dbError.message };
  }

  await insertActivityLog("uploaded", "document", documentId, { title: validated.data.title });

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
    return {
      ok: false,
      error: "Validation failed",
      fieldErrors: Object.fromEntries(
        validated.error.errors.map((e) => [e.path[0], e.message])
      ),
    };
  }

  const file = formData.get("file") as File;
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
      return { ok: false, error: fileSizeLimit.message ?? "The selected file is too large for your current plan." };
    }

    const storageLimit = await checkStorageLimit(file.size / (1024 * 1024), Number(document.file_size_mb ?? 0));
    if (!storageLimit.allowed) {
      await insertActivityLog("subscription.limit_reached", "organization", organization.id, {
        limit_type: "storage",
        current: storageLimit.current,
        projected: storageLimit.projected,
        max: storageLimit.max,
      });
      return { ok: false, error: storageLimit.message ?? "Document storage limit reached for your current plan." };
    }

    // New file uploaded - replace the old one
    const newFilePath = `${organization.id}/${validated.data.company_id}/${documentId}/${file.name}`;
    
    const { error: uploadError } = await supabase.storage
      .from("crm-documents")
      .upload(newFilePath, file);

    if (uploadError) {
      return { ok: false, error: `Upload failed: ${uploadError.message}` };
    }

    // Remove old file
    if (newFilePath !== document.file_path) {
      await supabase.storage.from("crm-documents").remove([document.file_path]);
    }

    filePath = newFilePath;
    fileMetadata = {
      file_name: file.name,
      file_path: filePath,
      file_size_mb: Number((file.size / (1024 * 1024)).toFixed(2)),
      mime_type: file.type,
      file_extension: file.name.split(".").pop(),
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

export async function deleteDocument(documentId: string): Promise<DocumentActionState> {
  const { organization, document } = await validateDocumentOwnership(documentId);
  const supabase = await createClient();

  // 1. Delete file from storage
  const { error: storageError } = await supabase.storage
    .from("crm-documents")
    .remove([document.file_path]);

  if (storageError) {
    return { ok: false, error: storageError.message };
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

export async function getSignedDocumentUrl(filePath: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .storage
    .from("crm-documents")
    .createSignedUrl(filePath, 3600); // 1 hour

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}
