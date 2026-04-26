import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
  phone: string | null;
  is_super_admin: boolean;
};

export type Organization = {
  id: string;
  name: string;
  slug: string;
  company_size: string | null;
  owner_user_id: string;
};

type PermissionRow = {
  roles: {
    role_permissions: {
      permissions: {
        key: string;
      } | null;
    }[];
  } | null;
};

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, organization_id, email, full_name, avatar_url, job_title, phone, is_super_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function getCurrentOrganization(): Promise<Organization | null> {
  const profile = await getCurrentProfile();

  if (!profile?.organization_id) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, company_size, owner_user_id")
    .eq("id", profile.organization_id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function requireOrganization(): Promise<Organization> {
  await requireAuth();
  const organization = await getCurrentOrganization();

  if (!organization) {
    redirect("/onboarding/workspace");
  }

  return organization;
}

export async function getUserPermissions(): Promise<string[]> {
  const user = await getCurrentUser();
  const profile = await getCurrentProfile();

  if (!user || !profile?.organization_id) {
    return [];
  }

  if (profile.is_super_admin) {
    return ["*"];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_roles")
    .select("roles(role_permissions(permissions(key)))")
    .eq("user_id", user.id)
    .eq("organization_id", profile.organization_id);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as unknown as PermissionRow[];
  const permissions = new Set<string>();

  for (const row of rows) {
    for (const rolePermission of row.roles?.role_permissions ?? []) {
      if (rolePermission.permissions?.key) {
        permissions.add(rolePermission.permissions.key);
      }
    }
  }

  return [...permissions];
}

export async function hasPermission(permission: string): Promise<boolean> {
  const permissions = await getUserPermissions();
  return permissions.includes("*") || permissions.includes(permission);
}
