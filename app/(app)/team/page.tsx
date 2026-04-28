import { Mail, Shield, Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { GuidanceStrip } from "@/components/shared/guidance-strip";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvitationTable } from "@/components/team/invitation-table";
import { InviteUserForm } from "@/components/team/invite-user-form";
import { RoleTable } from "@/components/team/role-table";
import { TeamMemberTable } from "@/components/team/team-member-table";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import {
  getCurrentUserId,
  getPermissions,
  getRolesWithPermissions,
  getTeamInvitations,
  getTeamMembers,
} from "@/lib/team/team-queries";

export default async function TeamPage() {
  await requirePermission("team.view");

  const [members, invitations, roles, permissions, currentUserId, canInvite, canUpdateRole, canDeactivate, canManageRoles] =
    await Promise.all([
      getTeamMembers(),
      getTeamInvitations(),
      getRolesWithPermissions(),
      getPermissions(),
      getCurrentUserId(),
      hasPermission("team.invite"),
      hasPermission("team.update_role"),
      hasPermission("team.deactivate"),
      hasPermission("settings.manage"),
    ]);

  const pendingInvitationCount = invitations.filter((invitation) => invitation.status === "pending").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team"
        description="Manage organization members, invitation links, roles, and CRM access permissions."
        actions={canInvite ? <InviteUserForm roles={roles} /> : undefined}
      />
      <GuidanceStrip>
        Invitation links can be copied and shared manually when an email provider is not connected yet.
      </GuidanceStrip>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="members">
            <Users className="mr-2 h-4 w-4" />
            Team Members
          </TabsTrigger>
          <TabsTrigger value="invitations">
            <Mail className="mr-2 h-4 w-4" />
            Invitations
            {pendingInvitationCount > 0 ? <Badge className="ml-2">{pendingInvitationCount}</Badge> : null}
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="mr-2 h-4 w-4" />
            Roles & Permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <TeamMemberTable
            members={members}
            roles={roles}
            currentUserId={currentUserId}
            canUpdateRole={canUpdateRole}
            canDeactivate={canDeactivate}
          />
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          {!canInvite ? (
            <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
              You can review invitation history here, but you do not have permission to create or manage invites.
            </div>
          ) : null}
          <InvitationTable invitations={invitations} canManage={canInvite} />
        </TabsContent>

        <TabsContent value="roles" className="space-y-4">
          {!canManageRoles ? (
            <div className="rounded-lg border bg-white p-4 text-sm text-muted-foreground">
              You can review roles and permissions here. Editing is limited to users with settings management access.
            </div>
          ) : null}
          <RoleTable roles={roles} permissions={permissions} canManage={canManageRoles} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
