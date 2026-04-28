"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive, Shield } from "lucide-react";
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
import { archiveRole } from "@/lib/team/team-actions";
import type { Permission, RoleWithPermissions } from "@/lib/team/types";
import { cn } from "@/lib/utils";
import { PermissionMatrix } from "./permission-matrix";
import { RoleForm } from "./role-form";

type RoleTableProps = {
  roles: RoleWithPermissions[];
  permissions: Permission[];
  canManage: boolean;
};

export function RoleTable({ roles, permissions, canManage }: RoleTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(roles[0]?.id ?? null);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  if (roles.length === 0) {
    return (
      <EmptyState
        title="No roles available"
        description="Create a custom role to start managing permissions."
        icon={Shield}
      />
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="space-y-4">
        <RoleForm key={selectedRole?.id ?? "new-role"} selectedRole={selectedRole} canManage={canManage} onSaved={() => router.refresh()} />
        <div className="overflow-hidden rounded-lg border bg-white">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow
                  key={role.id}
                  className={cn("cursor-pointer", selectedRoleId === role.id && "bg-muted/30")}
                  onClick={() => setSelectedRoleId(role.id)}
                >
                  <TableCell>
                    <div className="font-medium">{role.name}</div>
                    <div className="text-xs text-muted-foreground">{role.description ?? "No description"}</div>
                  </TableCell>
                  <TableCell>{role.is_system ? "System" : "Custom"}</TableCell>
                  <TableCell className="text-right">
                    {!role.is_system && canManage ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={isPending}
                        onClick={(event) => {
                          event.stopPropagation();
                          setArchiveId(role.id);
                        }}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Protected</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <PermissionMatrix key={selectedRole?.id ?? "no-role"} role={selectedRole} permissions={permissions} canManage={canManage} onSaved={() => router.refresh()} />

      <ConfirmModal
        open={Boolean(archiveId)}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Archive role"
        description="This permanently removes the custom role after all assigned users have been moved elsewhere."
        confirmLabel="Archive role"
        onConfirm={() => {
          if (!archiveId) {
            return;
          }

          startTransition(async () => {
            await archiveRole(archiveId);
            setArchiveId(null);
            router.refresh();
          });
        }}
      />
    </div>
  );
}
