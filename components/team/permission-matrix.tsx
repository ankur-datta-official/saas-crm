"use client";

import { useEffect, useState, useTransition } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { updateRolePermissions } from "@/lib/team/team-actions";
import { PERMISSION_GROUPS, type Permission, type RoleWithPermissions } from "@/lib/team/types";
import { cn } from "@/lib/utils";

type PermissionMatrixProps = {
  role: RoleWithPermissions | null;
  permissions: Permission[];
  canManage: boolean;
  onSaved: () => void;
};

export function PermissionMatrix({ role, permissions, canManage, onSaved }: PermissionMatrixProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const permissionByKey = new Map(permissions.map((permission) => [permission.key, permission]));

  useEffect(() => {
    if (!role) {
      setSelectedPermissionIds([]);
      return;
    }

    setSelectedPermissionIds(
      role.permissions
        .map((permissionKey) => permissionByKey.get(permissionKey)?.id ?? null)
        .filter((permissionId): permissionId is string => Boolean(permissionId)),
    );
  }, [permissionByKey, role]);

  function togglePermission(permissionId: string) {
    setSelectedPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((value) => value !== permissionId)
        : [...current, permissionId],
    );
  }

  function handleSave() {
    if (!role || !canManage) {
      return;
    }

    startTransition(async () => {
      await updateRolePermissions(role.id, selectedPermissionIds);
      onSaved();
    });
  }

  if (!role) {
    return (
      <div className="rounded-lg border bg-white p-8 text-center text-muted-foreground">
        Select a role to review its permissions.
      </div>
    );
  }

  const isAdminRole = role.slug === "organization-admin";

  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">{role.name}</h3>
          <p className="text-sm text-muted-foreground">{role.description ?? "No description provided."}</p>
        </div>
        <Button type="button" onClick={handleSave} disabled={!canManage || isPending || isAdminRole}>
          <Save className="mr-2 h-4 w-4" />
          {isPending ? "Saving..." : "Save Permissions"}
        </Button>
      </div>
      {isAdminRole ? (
        <div className="mt-4 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
          <ShieldCheck className="mt-0.5 h-5 w-5" />
          <div>Organization Admin always keeps full access. This role is shown for visibility and cannot be reduced.</div>
        </div>
      ) : null}
      <div className="mt-6 space-y-6">
        {Object.entries(PERMISSION_GROUPS).map(([groupKey, group]) => (
          <section key={groupKey} className="space-y-3">
            <div>
              <h4 className="font-medium">{group.label}</h4>
              <p className="text-sm text-muted-foreground">Choose which actions this role can perform.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {group.permissions.map((permissionKey) => {
                const permission = permissionByKey.get(permissionKey);
                if (!permission) {
                  return null;
                }

                const checked = selectedPermissionIds.includes(permission.id) || isAdminRole;

                return (
                  <label
                    key={permission.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3",
                      checked ? "border-primary bg-primary/5" : "bg-background",
                      (!canManage || isAdminRole) && "opacity-80",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={!canManage || isAdminRole}
                      onCheckedChange={() => togglePermission(permission.id)}
                    />
                    <span className="space-y-1">
                      <span className="block text-sm font-medium">{permission.name}</span>
                      <span className="block text-xs text-muted-foreground">{permission.description ?? permission.key}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

