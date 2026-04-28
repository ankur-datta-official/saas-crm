# Supabase Setup

This CRM uses Supabase Auth, Postgres, Storage, and Row Level Security for tenant-safe multi-tenant access.

## 1. Create a Supabase project

1. Create a new Supabase project.
2. Copy the project URL and publishable key from `Project Settings > API`.
3. Keep the service role key private and server-only.

## 2. Environment variables

Create `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-legacy-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000

SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

REMINDER_EMAIL_ENABLED=false
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
CRON_SECRET=your-random-cron-secret
```

Notes:

- Use either `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or the legacy anon key fallback.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code.
- `NEXT_PUBLIC_APP_URL` is used for invite links and auth redirects.

## 3. Run migrations in order

Run these files in this exact order for a fresh staging or production setup:

1. `supabase/migrations/001_core_saas_schema.sql`
2. `supabase/migrations/002_seed_platform_data.sql`
3. `supabase/migrations/003_crm_base_company_management.sql`
4. `supabase/migrations/004_contact_person_management.sql`
5. `supabase/migrations/005_interaction_meeting_log.sql`
6. `supabase/migrations/006_followup_reminder_management.sql`
7. `supabase/migrations/007_document_management.sql`
8. `supabase/migrations/008_need_help_escalation.sql`
9. `supabase/migrations/009_team_role_permission_management.sql`
10. `supabase/migrations/010_subscription_plan_limits.sql`
11. `supabase/migrations/012_notifications_search_polish.sql`

Legacy note:

- `supabase/migrations/011_fix_admin_permissions.sql` is a repair migration for older upgraded environments only.
- Do not include `011_fix_admin_permissions.sql` in the default fresh staging install chain unless you are repairing a previously upgraded database.

## 4. Required manual platform setup

### Auth redirects

Set site URL:

```bash
http://localhost:3000
```

Add redirect URLs:

```bash
http://localhost:3000/onboarding/workspace
http://localhost:3000/auth/accept-invite
```

### Storage bucket

Create a private storage bucket named:

```bash
crm-documents
```

Recommended folder pattern:

```bash
organization_id/company_id/document_id/original-file-name
```

## 5. Core verification flow

1. Run `npm run dev`.
2. Register at `/auth/register`.
3. Create a workspace at `/onboarding/workspace`.
4. Confirm:
   - one `profiles` row was created
   - one `organizations` row was created
   - one `organization_subscriptions` row exists on Starter
   - default roles and permissions are seeded
   - default pipeline stages exist
5. Visit `/dashboard`.
6. Log out and confirm protected pages redirect to `/auth/login`.

## 6. Security notes

- All create and update actions must derive `organization_id` from the signed-in profile or server helpers.
- Inactive users are redirected to `/unauthorized`.
- Minimum page-level permission gates are enforced for:
  - `/team`
  - `/reports`
  - `/settings`
  - `/subscription`
- File upload limits are enforced server-side through subscription checks.
- The cron reminder endpoint is protected by `CRON_SECRET`.

## 7. Sprint 10 manual test

1. Open `/team`.
2. Confirm the current user appears in Team Members.
3. Create an invitation for another email.
4. Copy the invite link.
5. Cancel an invitation.
6. Resend an invitation.
7. Change a user role.
8. Deactivate and reactivate a user.
9. Update role permissions.
10. Confirm `activity_logs` contains team-related events.

Invite notes:

- Invite links work without an email provider.
- The acceptance route is `/auth/accept-invite?token=...`.

## 8. Sprint 11 manual test

1. Open `/subscription`.
2. Confirm current plan and usage load.
3. Test user seat limit with active users and pending invites.
4. Test company limit during company creation.
5. Test file-size and storage limit during document upload.
6. Confirm custom pipeline is blocked on plans without `custom_pipeline`.
7. Confirm advanced reports are locked on plans without `advanced_reports`.
8. If you have `subscription.manage`, switch plans manually for testing.
9. Confirm `activity_logs` contains `subscription.plan_changed`, `subscription.limit_reached`, and `subscription.feature_blocked`.

Notes:

- Payment gateway and billing automation are not implemented.
- Manual plan switching is for internal testing only.

## 9. Sprint 12 manual test

1. Open any protected page and confirm the topbar search is visible on desktop.
2. Search across:
   - company name
   - contact email/mobile
   - meeting discussion text
   - follow-up title
   - document title or file name
   - help request title
3. Click a dropdown result and confirm the correct detail page opens.
4. Press Enter and confirm `/search?q=...` opens grouped results.
5. Create a follow-up assigned to another user and confirm a notification appears.
6. Assign or resolve a help request and confirm a notification appears for the target user.
7. Upload a document for a company with an assigned owner and confirm a notification appears.
8. Open the notification bell and confirm unread count, mark-one-read, and mark-all-read work.
9. Confirm search results and notifications remain tenant-safe.

## 10. Reminder cron test

1. Set:

```bash
REMINDER_EMAIL_ENABLED=false
CRON_SECRET=test-secret
```

2. Call:

```bash
GET /api/cron/followup-reminders?secret=test-secret
```

3. Confirm skipped reminders are logged safely when email sending is disabled.

## 11. Sprint 15 manual test

1. Create or confirm companies exist in multiple pipeline stages.
2. Open `/pipeline`.
3. Confirm each active stage renders as a board column.
4. Drag a company from `New Lead` to `Proposal Sent`.
5. Open the company profile and confirm the stage changed there too.
6. Use the card action to move a company to Won.
7. Use the card action to move a company to Lost.
8. Test board filters for assigned user, industry, category, temperature, priority, and expected closing date.
9. Confirm activity logs contain `company.pipeline_stage_changed`.
10. Confirm the board stays readable on mobile or narrower layouts.

## 12. Optional demo data

An optional seed file is available at:

```bash
supabase/seeds/demo_data.sql
```

Do not auto-run it in production. Use it only for local demos, staging previews, or QA.

## 13. Final verification

1. Run `npm run build`.
2. Run `npm run typecheck`.
3. Run `npm run lint`.
4. Review `docs/QA_CHECKLIST.md`.
5. Review `docs/DEPLOYMENT_GUIDE.md`.
6. Review `docs/CLIENT_DEMO_SCRIPT.md`.
7. Review `docs/STAGING_SMOKE_TEST.md`.
8. Review `docs/HANDOFF_SUMMARY.md`.
