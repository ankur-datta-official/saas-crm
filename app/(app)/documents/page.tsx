import { FileText } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function DocumentsPage() {
  return (
    <ModulePlaceholder
      title="Documents"
      description="Track document requests, submissions, approvals, and client-side evidence."
      emptyTitle="Document submission tracking comes later"
      emptyDescription="Storage buckets, submission status, and audit history are intentionally deferred."
      icon={FileText}
    />
  );
}
