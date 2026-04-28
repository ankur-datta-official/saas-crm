"use server";

import { getCurrentUser, getUserPermissions, requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { Permission, RoleRow, RoleWithPermissions, TeamInvitation, TeamMember } from "./types";

type InvitationPreview = {
  id: string;
  organization_id: string;
  organization_name: string;
  email: string;
  full_name: string | null;
  job_title: string | null;
  department: string | null;
  phone: string | null;
  role_id: string;
  role_name: string | null;
  status: TeamInvitation["status"];
  expires_at: string;
};

function normalizeInvitationStatus<T extends { status: TeamInvitation["status"]; expires_at: string }>(invitation: T): T {
  if (invitation.status === "pending" && new Date(invitation.expires_at).getTime() < Date.now()) {
    return { ...invitation, status: "expired" };
  }

  return invitation;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_team_members_for_current_organization");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TeamMember[];
}

export async function getTeamMemberById(userId: string): Promise<TeamMember | null> {
  const members = await getTeamMembers();
  return members.find((member) => member.id === userId) ?? null;
}

export async function getTeamInvitations(): Promise<TeamInvitation[]> {
  const organization = await requireOrganization();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("team_invitations")
    .select(`
      id,
      organization_id,
      email,
      role_id,
      invited_by,
      token,
      full_name,
      job_title,
      department,
      phone,
      status,
      expires_at,
      accepted_at,
      created_at,
      roles(id, name, slug),
      inviter:profiles!team_invitations_invited_by_fkey(full_name)
    `)
    .eq("organization_id", organization.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const role = row.roles as { id: string; name: string; slug: string } | null;
    const inviter = row.inviter as { full_name: string | null } | null;

    return normalizeInvitationStatus({
      ...(row as unknown as TeamInvitation),
      role_name: role?.name ?? null,
      role_slug: role?.slug ?? null,
      invited_by_name: inviter?.full_name ?? "Unknown",
      invite_link: `/auth/accept-invite?token=${row.token as string}`,
    });
  });
}

export async function getRoles(): Promise<RoleRow[]> {
  const organization = await requireOrganization();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("roles")
    .select("id, name, slug, description, is_system, organization_id")
    .eq("organization_id", organization.id)
    .order("is_system", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RoleRow[];
}

export async function getRoleById(roleId: string): Promise<RoleWithPermissions | null> {
  const organization = await requireOrganization();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("roles")
    .select("id, name, slug, description, is_system, organization_id")
    .eq("id", roleId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as RoleRow),
    permissions: await getRolePermissions(roleId),
  };
}

export async function getPermissions(): Promise<Permission[]> {
  await requireOrganization();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("permissions")
    .select("id, key, name, description")
    .order("key", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Permission[];
}

export async function getRolePermissions(roleId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("role_permissions")
    .select("permissions(key)")
    .eq("role_id", roleId);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Array<{ permissions: { key: string }[] | { key: string } | null }>)
    .map((row) => {
      if (Array.isArray(row.permissions)) {
        return row.permissions[0]?.key ?? null;
      }

      return row.permissions?.key ?? null;
    })
    .filter((value): value is string => Boolean(value));
}

export async function getRolesWithPermissions(): Promise<RoleWithPermissions[]> {
  const roles = await getRoles();
  const permissions = await Promise.all(roles.map((role) => getRolePermissions(role.id)));

  return roles.map((role, index) => ({
    ...role,
    permissions: permissions[index] ?? [],
  }));
}

export async function getCurrentUserPermissions(): Promise<string[]> {
  return getUserPermissions();
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser();
  return user?.id ?? null;
}

export async function getInvitationPreview(token: string): Promise<InvitationPreview | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_team_invitation_preview", {
    invite_token: token,
  });

  if (error) {
    throw new Error(error.message);
  }

  const invitation = Array.isArray(data) ? data[0] : data;
  if (!invitation) {
    return null;
  }

  return normalizeInvitationStatus(invitation as InvitationPreview);
}

export async function getPendingInvitationsCount(): Promise<number> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("team_invitations")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getActiveUsersCount(): Promise<number> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id)
    .eq("is_active", true);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
