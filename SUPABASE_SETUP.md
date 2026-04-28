# Supabase Setup

This project uses Supabase Auth, Supabase PostgreSQL, and Row Level Security for tenant isolation.

## 1. Create a Supabase Project

1. Go to the Supabase dashboard and create a new project.
2. Copy the project URL and publishable key from **Project Settings > API**.
3. Keep the service role key private. It is not required by the current app runtime, but is listed for future admin scripts.

## 2. Environment Variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The app validates the public Supabase URL, publishable key, and app URL before creating Supabase clients.

## 3. Run SQL Migrations

Run these files in order from the Supabase SQL editor or your migration workflow:

1. `supabase/migrations/001_core_saas_schema.sql`
2. `supabase/migrations/002_seed_platform_data.sql`
3. `supabase/migrations/003_crm_base_company_management.sql`
4. `supabase/migrations/004_contact_person_management.sql`
5. `supabase/migrations/005_interaction_meeting_log.sql`
6. `supabase/migrations/006_followup_reminder_management.sql`
7. `supabase/migrations/007_document_management.sql`
8. `supabase/migrations/008_need_help_escalation.sql`
9. `supabase/migrations/009_team_role_permission_management.sql`

The first migration creates:

- `organizations`
- `subscription_plans`
- `organization_subscriptions`
- `profiles`
- `roles`
- `permissions`
- `role_permissions`
- `user_roles`
- `pipeline_stages`
- `activity_logs`

It also enables Row Level Security, creates tenant policies, creates the `profiles` row automatically when a Supabase Auth user is created, and defines `create_organization_workspace()`.

The second migration seeds:

- Starter, Professional, Business, Enterprise subscription plans
- Base permissions used by default organization roles

The third migration adds Sprint 3 CRM base tables and settings:

- `industries`
- `company_categories`
- `companies`
- pipeline stage color support
- RLS policies and grants for tenant-scoped CRM settings and company lead records
- default company categories for each organization

The fourth migration adds Sprint 4 contact person management:

- `contact_persons`
- tenant-safe RLS and grants
- company/contact tenant validation trigger
- single primary contact enforcement per company
- contact audit-log insert support

The fifth migration adds Sprint 5 meeting and interaction logging:

- `interactions`
- tenant-safe RLS and grants
- company/contact tenant validation trigger
- company lead temperature support for `very_hot`

The sixth migration adds Sprint 6 follow-up and reminder management:

- `followups`
- `email_reminder_logs`
- tenant-safe RLS and grants
- company/contact/interaction tenant validation triggers

## 4. Auth Settings

For fastest local testing, disable email confirmation in Supabase Auth settings. If email confirmation stays enabled, the user must confirm their email and sign in before creating a workspace.

Set the site URL to:

```bash
http://localhost:3000
```

Add this redirect URL:

```bash
http://localhost:3000/onboarding/workspace
```

## 5. Test the Flow

1. Run the app:

```bash
npm run dev
```

2. Open `http://localhost:3000/auth/register`.
3. Register with an email, password, and full name.
4. Create a workspace at `/onboarding/workspace`.
5. Confirm that Supabase created:
   - one `profiles` row for the auth user
   - one `organizations` row
   - one trial `organization_subscriptions` row on the Starter plan
   - default organization roles
   - Organization Admin assignment for the registering user
   - default pipeline stages
6. Visit `/dashboard`.
7. Log out from the topbar and confirm `/dashboard` redirects to `/auth/login`.

## 6. Tenant Isolation Notes

Every organization-level table has `organization_id`, and RLS policies compare it to the signed-in user's `profiles.organization_id`.

Current policy posture:

- Users can read their own profile.
- Organization members can read their organization, subscription, roles, role permissions, user roles, pipeline stages, and activity logs.
- Pipeline stages include a basic manage policy for organization members so future admin screens can build on it.
- Super admin support is prepared through JWT `app_metadata.is_super_admin`.

Contact person, meeting, follow-up, report, and document domain tables are intentionally deferred to later sprints.

## 7. Test Company CRUD

After running all three SQL files:

1. Register and create a workspace.
2. Open `/settings/industries` and add an industry.
3. Open `/settings/company-categories` and confirm the default A+ through D categories exist.
4. Open `/settings/pipeline` and edit a stage color or probability.
5. Open `/companies/new` and create a company lead.
6. Confirm `/companies` shows the lead and filters work.
7. Open the company profile at `/companies/[id]`.
8. Edit the company and change its pipeline stage.
9. Archive the company from the list.
10. Confirm `activity_logs` has records for create, update, pipeline change, and archive actions.

Company, contact person, meeting, follow-up, document upload, reports, and import/export workflows beyond this base CRUD remain deferred to later sprints.

## 8. Test Contact CRUD

After running all four SQL files:

1. Create or open a company lead.
2. Open `/contacts/new` or use the company profile Add Contact button.
3. Create multiple contacts for the same company.
4. Mark one contact as primary and confirm other contacts for that company are no longer primary.
5. Open `/contacts` and test search/filter by company, decision role, relationship level, preferred method, and status.
6. Open `/contacts/[id]` and confirm the contact detail page shows company, role, relationship, communication fields, created by, and created date.
7. Edit and archive a contact.
8. Confirm the company profile Contacts section updates with real contact data.
9. Confirm `activity_logs` has records for contact created, updated, archived, and primary changed.

## 9. Test Meeting / Interaction Logs

After running all five SQL files:

1. Open `/meetings/new`.
2. Select a company and enter discussion details.
3. Add optional rating, lead temperature, next action, and next follow-up date.
4. Save and confirm the meeting opens at `/meetings/[id]`.
5. Confirm `/meetings` search and filters work.
6. Open a company profile and confirm the Meetings section shows the interaction timeline.
7. Edit the meeting and change success rating.
8. Confirm the related company latest rating and lead temperature update.
9.171→9. Archive the meeting.
172→10. Confirm `activity_logs` records meeting created, updated, archived, company rating updated, and next follow-up added.
173→
174→## 10. Test Follow-up & Reminder Management
175→
176→After running all six SQL files:
177→
178→1. Open `/followups/new`.
179→2. Select a company and enter a title and scheduled time.
180→3. Save and confirm the follow-up opens at `/followups/[id]`.
181→4. Confirm `/followups` search and filters (Today, Upcoming, Overdue, etc.) work.
182→5. Open a company profile and confirm the Follow-ups section shows the real data.
183→6. On a meeting detail page, click "Create Follow-up" and confirm company/contact/interaction are pre-filled.
184→7. Mark a follow-up as complete from the list or card and confirm `completed_at` is set.
185→8. Reschedule, Cancel, or Archive a follow-up and confirm the status changes.
9. Confirm `activity_logs` records follow-up created, updated, completed, rescheduled, cancelled, and archived.
10. Test Email Reminders foundation:
    - Set `REMINDER_EMAIL_ENABLED=false` and `CRON_SECRET=test-secret` in `.env.local`.
    - Call `GET /api/cron/followup-reminders?secret=test-secret`.
    - Confirm the response shows processed items and logs show "[Email Reminder Skipped]".
    - Confirm `email_reminder_logs` has "skipped" records.

## 11. Test Document Management

After running all seven SQL files:

1. Create a storage bucket named `crm-documents` in the Supabase Dashboard (Storage section).
   - Set the bucket to **Private**.
2. Open `/documents/new`.
3. Select a company, enter a title, and upload a file.
4. Confirm the document detail page opens at `/documents/[id]`.
5. Test downloading the file.
6. Open `/documents` and test filters by company, type, and status.
7. Edit a document and change its status.
8. Archive or Delete a document and confirm it's removed or hidden.
9. Confirm `activity_logs` records document created, updated, archived, and deleted.
10. Verify that files are correctly uploaded to the `crm-documents` bucket in a folder structure like `organization_id/file_name`.

## 12. Test Help Request / Escalation Management

After running all eight SQL files:

1. Open `/need-help/new`.
2. Select a company and a priority level.
3. Enter a title and description for the help request.
4. Optionally link the request to a meeting, follow-up, or document.
5. Save and confirm the help request opens at `/need-help/[id]`.
6. Confirm the status is "Open" and the request appears in the `/need-help` list.
7. Assign the request to another user using the Assign button and confirm the status changes to "In Progress".
8. Add a comment to the request using the comment form.
9. Mark the request as Resolved and confirm the status changes.
10. Reopen the request and confirm the status changes back to "Open".
11. Test filtering at `/need-help` by status (Open, In Progress, Resolved, Closed, Rejected).
12. Open a company profile and confirm the "Need Help / Escalations" section shows the request.
13. Open a meeting, follow-up, or document detail page and confirm the "Create Help Request" button links to the correct pre-filled form.
14. Check the dashboard and confirm the "Open Help Requests" stat card displays the correct count.
15. Confirm `activity_logs` records help request created, assigned, status changes, and comments added.

### Sprint 9: Reports & Analytics
1. Access `/reports` in the browser.
2. Verify that all report tabs load correctly:
   - Sales Overview (KPIs and Charts)
   - Leads (Industry/Category distribution)
   - Pipeline (Funnel and Value by stage)
   - Meetings (Type and Salesperson distribution)
   - Follow-ups (Completion rate and Overdue)
   - Documents (Type and Status distribution)
   - Help Requests (Priority and Status distribution)
   - Team Performance (User-wise activity matrix)
3. Test Global Filters:
   - Date range (Today, This Week, etc.)
   - Assigned User
   - Industry
   - Pipeline Stage
   - Lead Temperature
   - Company Category
4. Test Export:
   - Click "Export CSV" on any report table.
   - Click "Print" to see the print-friendly view.
5. Verify Tenant Isolation:
   - Reports should only show data for the current organization.
   - Filter options (Users, Industries, etc.) should be organization-specific.

## Verification Checklist

## 13. Sprint 10 Team, Roles, and Permissions

Run migration 009 after the earlier core and CRM migrations. It adds:

- `team_invitations`
- team invitation acceptance RPC helpers
- tenant-safe profile visibility for team management
- `profiles.department`
- `profiles.is_active`
- updated default role and permission seeding for new and existing organizations

Invite link notes:

- Sprint 10 supports manual invite links even if no email provider is configured.
- The UI shows a copyable `/auth/accept-invite?token=...` link after invitation creation.
- If you later add email delivery, reuse the same token and acceptance route instead of exposing the service role key to the client.

Permission testing notes:

- `/team` requires `team.view`
- `/reports` requires `reports.view`
- `/settings` requires `settings.view` or `settings.manage`
- settings management pages require `settings.manage`
- `/subscription` requires `subscription.view`
- deeper action-level permission checks across older CRUD modules are still a follow-up item for later hardening

Manual testing steps for Sprint 10:

1. Run `supabase/migrations/009_team_role_permission_management.sql` in the Supabase SQL Editor.
2. Run `npm run dev`.
3. Log in as an Organization Admin.
4. Open `/team`.
5. Confirm the current signed-in user appears in Team Members.
6. Create an invitation for another email address.
7. Copy the invite link from the success state.
8. Confirm the invitation appears in the Invitations tab.
9. Cancel the invitation and confirm its status changes.
10. Create another invitation and use Resend to generate a fresh token.
11. Change an active user role from the Team Members tab.
12. Deactivate a user and confirm they remain visible as Inactive.
13. Reactivate the same user.
14. Open Roles & Permissions.
15. Select the Sales Executive role.
16. Adjust permission checkboxes and save.
17. Confirm Organization Admin still shows full access and cannot be reduced.
18. Open `/reports` with a user that has `reports.view` and with one that does not.
19. Open `/settings` with a user that has `settings.view` or `settings.manage`.
20. Open `/subscription` with a user that has `subscription.view`.
21. Accept an invite at `/auth/accept-invite?token=...` using a user that is not already in another organization.
22. Check `activity_logs` for invite, cancel, resend, accept, role, deactivate, reactivate, and permission update entries.
23. Run `npm run build`.
