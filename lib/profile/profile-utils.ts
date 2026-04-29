import { createClient } from "@/lib/supabase/server";
import { logServerError } from "@/lib/errors";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";

const EXTERNAL_URL_PATTERN = /^(https?:)?\/\//i;

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "");
}

export function sanitizeAvatarFileName(fileName: string) {
  const cleaned = fileName
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+/, "")
    .trim();

  const fallback = cleaned || "avatar";
  return fallback.slice(0, 100);
}

export function isStoredProfileAvatarPath(value?: string | null) {
  if (!value) {
    return false;
  }

  return !EXTERNAL_URL_PATTERN.test(value) && !value.startsWith("/") && !value.startsWith("data:") && !value.startsWith("blob:");
}

export function buildProfileAvatarPath(organizationId: string, profileId: string, fileName: string) {
  const safeOrganizationId = sanitizePathSegment(organizationId);
  const safeProfileId = sanitizePathSegment(profileId);
  const safeFileName = sanitizeAvatarFileName(fileName);

  return `${safeOrganizationId}/${safeProfileId}/${safeFileName}`;
}

export async function resolveProfileAvatarUrl(avatarUrl?: string | null, expiresInSeconds = 900) {
  if (!avatarUrl) {
    return null;
  }

  if (!isStoredProfileAvatarPath(avatarUrl)) {
    return avatarUrl;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(PROFILE_AVATAR_BUCKET).createSignedUrl(avatarUrl, expiresInSeconds);

  if (error || !data?.signedUrl) {
    logServerError("profile.avatar.resolve", error ?? new Error("Signed avatar URL was not returned."), {
      avatarPath: avatarUrl,
      expiresInSeconds,
    });
    return null;
  }

  return data.signedUrl;
}
