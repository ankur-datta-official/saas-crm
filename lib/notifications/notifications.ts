"use server";

import { getCurrentUser, requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type NotificationRow = {
  id: string;
  organization_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
};

type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
};

export async function getNotifications(limit = 8): Promise<NotificationRow[]> {
  const organization = await requireOrganization();
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, organization_id, user_id, type, title, message, link, is_read, read_at, created_at")
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as NotificationRow[];
}

export async function getUnreadNotificationCount() {
  const organization = await requireOrganization();
  const user = await getCurrentUser();

  if (!user) {
    return 0;
  }

  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function markNotificationAsRead(notificationId: string) {
  const organization = await requireOrganization();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("organization_id", organization.id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function markAllNotificationsAsRead() {
  const organization = await requireOrganization();
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}

export async function createNotification(input: CreateNotificationInput) {
  const organization = await requireOrganization();
  const supabase = await createClient();

  const { error } = await supabase.from("notifications").insert({
    organization_id: organization.id,
    user_id: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true };
}
