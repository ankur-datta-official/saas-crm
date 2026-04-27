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
9. Archive the meeting.
10. Confirm `activity_logs` records meeting created, updated, archived, company rating updated, and next follow-up added.
