"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { 
  Edit, 
  FileDown, 
  Search, 
  Archive, 
  MoreHorizontal,
  Calendar,
  User,
  Building2,
  FileText,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { DocumentTypeBadge, DocumentStatusBadge, FileSizeBadge } from "./document-badges";
import { archiveDocument } from "@/lib/crm/document-actions";
import { useDocumentDownload } from "./document-download";
import type { Document, Company, TeamMemberOption } from "@/lib/crm/types";
import { documentTypeOptions, documentStatusOptions } from "@/lib/crm/schemas";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

type DocumentTableProps = {
  documents: Document[];
  companies: Company[];
  teamMembers: TeamMemberOption[];
};

export function DocumentTable({ documents, companies, teamMembers }: DocumentTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { downloadDocument, downloadingDocumentId, downloadError, clearDownloadError } = useDocumentDownload();

  function applyFilters(formData: FormData) {
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      const text = String(value);
      if (text) params.set(key, text);
    }
    router.push(`/documents?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form action={applyFilters} className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              name="search"
              placeholder="Search title, file, remarks..."
              defaultValue={searchParams.get("search") ?? ""}
              className="crm-filter-input pl-9"
            />
          </div>
          
          <SelectLike 
            name="company" 
            defaultValue={searchParams.get("company") ?? ""} 
            options={companies.map((c) => [c.id, c.name])} 
            label="Filter by Company" 
          />
          
          <SelectLike 
            name="type" 
            defaultValue={searchParams.get("type") ?? ""} 
            options={documentTypeOptions.map((t) => [t, t])} 
            label="Document Type" 
          />
          <details className="md:col-span-2 lg:col-span-2 xl:col-span-2">
            <summary className="crm-filter-summary">
              More filters
            </summary>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <SelectLike 
                name="status" 
                defaultValue={searchParams.get("status") ?? ""} 
                options={documentStatusOptions.map((s) => [s, s.charAt(0).toUpperCase() + s.slice(1)])} 
                label="Status" 
              />
              <SelectLike 
                name="uploadedBy" 
                defaultValue={searchParams.get("uploadedBy") ?? ""} 
                options={teamMembers.map((m) => [m.id, m.full_name ?? m.email])} 
                label="Uploaded By" 
              />
            </div>
          </details>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/documents")}
              title="Reset Filters"
            >
              Reset
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3 md:hidden">
        {documents.length === 0 ? (
          <EmptyState
            title="No documents found"
            description="No documents uploaded. Upload quotations, proposals, or company profiles."
            icon={FileText}
            actionLabel="Upload Document"
            actionHref="/documents/new"
          />
        ) : (
          documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onDownload={(target) => void downloadDocument(target.id)}
              onArchive={setArchiveId}
              isDownloading={downloadingDocumentId === doc.id}
            />
          ))
        )}
      </div>

      {documents.length > 0 ? (
        <div className="crm-table-shell hidden md:block">
          <div className="overflow-x-auto">
            <table className="crm-table min-w-[860px] table-fixed">
              <thead className="crm-table-head">
                <tr>
                  <th className="w-[24%] px-4 py-3 font-medium">Document Title</th>
                  <th className="w-[16%] px-4 py-3 font-medium">Company</th>
                  <th className="w-[13%] px-4 py-3 font-medium">Type</th>
                  <th className="w-[15%] px-4 py-3 font-medium">File Info</th>
                  <th className="w-[12%] px-4 py-3 font-medium text-center">Status</th>
                  <th className="w-[12%] px-4 py-3 font-medium">Uploaded</th>
                  <th className="w-[8%] px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b border-border/80 last:border-0 transition-colors hover:bg-slate-50/80">
                    <td className="crm-table-cell">
                      <div className="flex flex-col">
                        <Link href={`/documents/${doc.id}`} className="font-medium text-primary hover:underline">
                          {doc.title}
                        </Link>
                        {doc.submitted_to && (
                          <span className="text-[10px] text-muted-foreground mt-0.5">
                            To: {doc.submitted_to}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="crm-table-cell">
                      <Link href={`/companies/${doc.company_id}`} className="text-muted-foreground hover:text-primary transition-colors">
                        {doc.companies?.name ?? "N/A"}
                      </Link>
                    </td>
                    <td className="crm-table-cell">
                      <DocumentTypeBadge type={doc.document_type} />
                    </td>
                    <td className="crm-table-cell">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs truncate max-w-[150px]" title={doc.file_name}>
                          {doc.file_name}
                        </span>
                        <FileSizeBadge sizeMb={doc.file_size_mb} />
                      </div>
                    </td>
                    <td className="crm-table-cell text-center">
                      <DocumentStatusBadge status={doc.status} />
                    </td>
                    <td className="crm-table-cell">
                      <div className="flex flex-col text-xs">
                        <span className="font-medium">{doc.uploaded_profile?.full_name || "Unknown"}</span>
                        <span className="text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="crm-table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/documents/${doc.id}`}>Open</Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => void downloadDocument(doc.id)}
                              disabled={downloadingDocumentId === doc.id}
                            >
                              <FileDown className="w-4 h-4 mr-2" />
                              {downloadingDocumentId === doc.id ? "Downloading..." : "Download"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href={`/documents/${doc.id}/edit`}><Edit className="w-4 h-4 mr-2" />Edit</Link></DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => setArchiveId(doc.id)}
                            >
                              <Archive className="w-4 h-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="hidden md:block">
           <EmptyState
            title="No documents found"
            description="No documents uploaded. Upload quotations, proposals, or company profiles."
            icon={FileText}
            actionLabel="Upload Document"
            actionHref="/documents/new"
          />
        </div>
      )}

      <ConfirmModal
        open={Boolean(archiveId)}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Archive Document"
        description="Are you sure you want to archive this document? It will be hidden from active lists."
        confirmLabel="Archive"
        onConfirm={() => {
          if (!archiveId) return;
          startTransition(async () => {
            await archiveDocument(archiveId);
            setArchiveId(null);
            router.refresh();
          });
        }}
      />
      {downloadError ? (
        <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {downloadError}
          <button type="button" className="ml-2 underline underline-offset-2" onClick={clearDownloadError}>
            Dismiss
          </button>
        </div>
      ) : null}
      {isPending && <p className="text-xs text-muted-foreground animate-pulse">Processing...</p>}
    </div>
  );
}

function DocumentCard({ 
  document, 
  onDownload, 
  onArchive,
  isDownloading,
}: { 
  document: Document; 
  onDownload: (doc: Document) => void;
  onArchive: (id: string) => void;
  isDownloading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link href={`/documents/${document.id}`} className="font-semibold text-primary truncate block">
            {document.title}
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="w-3 h-3" />
            <span className="truncate">{document.companies?.name}</span>
          </div>
        </div>
        <DocumentStatusBadge status={document.status} />
      </div>

      <div className="flex flex-wrap gap-2">
        <DocumentTypeBadge type={document.document_type} />
        <FileSizeBadge sizeMb={document.file_size_mb} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {new Date(document.created_at).toLocaleDateString()}
        </div>
        <div className="flex items-center gap-1 truncate">
          <User className="w-3 h-3" />
          {document.uploaded_profile?.full_name || "Unknown"}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/documents/${document.id}`}>Open</Link>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
              <span className="sr-only">More actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onDownload(document)} disabled={isDownloading}><FileDown className="w-4 h-4 mr-2" />{isDownloading ? "Downloading..." : "Download"}</DropdownMenuItem>
            <DropdownMenuItem asChild><Link href={`/documents/${document.id}/edit`}><Edit className="w-4 h-4 mr-2" />Edit</Link></DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onArchive(document.id)}><Archive className="w-4 h-4 mr-2" />Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function SelectLike({
  label,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[][] }) {
  return (
    <select {...props} className="crm-filter-select">
      <option value="">{label}</option>
      {options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
    </select>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("crm-filter-surface", className)}>{children}</div>;
}
