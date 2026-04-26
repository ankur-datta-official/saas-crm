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
