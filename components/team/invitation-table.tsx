"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Mail } from "lucide-react";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cancelTeamInvitation, resendTeamInvitation } from "@/lib/team/team-actions";
import type { TeamInvitation } from "@/lib/team/types";
import { InvitationStatusBadge, RoleBadge } from "./role-badge";

type InvitationTableProps = {
  invitations: TeamInvitation[];
  canManage: boolean;
};

export function InvitationTable({ invitations, canManage }: InvitationTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [cancelId, setCancelId] = useState<string | null>(null);

  function refreshAfter(work: () => Promise<void>) {
    startTransition(async () => {
      await work();
      router.refresh();
    });
  }

  async function copyInviteLink(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/auth/accept-invite?token=${token}`);
  }

  if (invitations.length === 0) {
    return (
      <EmptyState
        title="No invitations yet"
        description="Pending, cancelled, expired, and accepted invitations will appear here."
        icon={Mail}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:hidden">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="rounded-lg border bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{invitation.email}</p>
                <p className="mt-1 text-sm text-muted-foreground">{invitation.invited_by_name ?? "Unknown inviter"}</p>
              </div>
              <InvitationStatusBadge status={invitation.status} />
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <RoleBadge name={invitation.role_name ?? "Unassigned"} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Expires</span>
                <span>{new Date(invitation.expires_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => copyInviteLink(invitation.token)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              {canManage && invitation.status === "pending" ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => refreshAfter(async () => {
                      await resendTeamInvitation(invitation.id);
                    })}
                  >
                    Resend
                  </Button>
                  <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => setCancelId(invitation.id)}>
                    Cancel
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-hidden rounded-lg border bg-white md:block">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Invited By</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitations.map((invitation) => (
              <TableRow key={invitation.id}>
                <TableCell>
                  <div className="font-medium">{invitation.email}</div>
                  {invitation.full_name ? <div className="text-xs text-muted-foreground">{invitation.full_name}</div> : null}
                </TableCell>
                <TableCell><RoleBadge name={invitation.role_name ?? "Unassigned"} /></TableCell>
                <TableCell>{invitation.invited_by_name ?? "Unknown"}</TableCell>
                <TableCell><InvitationStatusBadge status={invitation.status} /></TableCell>
                <TableCell>{new Date(invitation.expires_at).toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => copyInviteLink(invitation.token)}>
                      Copy Link
                    </Button>
                    {canManage && invitation.status === "pending" ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isPending}
                          onClick={() => refreshAfter(async () => {
                            await resendTeamInvitation(invitation.id);
                          })}
                        >
                          Resend
                        </Button>
                        <Button type="button" variant="ghost" size="sm" disabled={isPending} onClick={() => setCancelId(invitation.id)}>
                          Cancel
                        </Button>
                      </>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmModal
        open={Boolean(cancelId)}
        onOpenChange={(open) => !open && setCancelId(null)}
        title="Cancel invitation"
        description="The current invite link will stop working immediately."
        confirmLabel="Cancel invitation"
        onConfirm={() => {
          if (!cancelId) return;
          refreshAfter(async () => {
            await cancelTeamInvitation(cancelId);
            setCancelId(null);
          });
        }}
      />
    </div>
  );
}
