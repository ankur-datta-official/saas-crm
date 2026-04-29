import { PageHeader } from "@/components/shared/page-header";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { getCurrentProfileSettings } from "@/lib/profile/profile-actions";
import { requireOrganization } from "@/lib/auth/session";

export default async function ProfileSettingsPage() {
  await requireOrganization();
  const profile = await getCurrentProfileSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile Settings"
        description="Update your personal CRM profile and account details."
      />
      <ProfileSettingsForm profile={profile} />
    </div>
  );
}
