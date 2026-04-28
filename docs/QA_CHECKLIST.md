# QA Checklist

Use this checklist for final manual QA before a demo, staging release, or production deployment.

## Auth and onboarding

- Register a new user from `/auth/register`.
- Log in from `/auth/login`.
- Confirm invalid credentials show a user-friendly error.
- Confirm new users are redirected to `/onboarding/workspace`.
- Create a workspace successfully.
- Confirm logged-in users with a workspace land on `/dashboard`.
- Confirm logout returns the user to a public/auth screen.

## Dashboard

- Confirm dashboard stats load without layout breaks.
- Confirm active users and pending invitations widgets load if enabled.
- Confirm dashboard data is scoped to the current organization only.

## Companies

- Create a company from `/companies/new`.
- Search and filter companies.
- Open company detail.
- Edit company.
- Archive company.
- Confirm company list does not create full-page horizontal scroll.

## Contacts

- Create a contact from `/contacts/new`.
- Set a primary contact.
- Search and filter contacts.
- Open contact detail.
- Edit contact.
- Archive contact.

## Meetings

- Create a meeting from `/meetings/new`.
- Search and filter meetings.
- Open meeting detail.
- Edit meeting.
- Archive meeting.

## Follow-ups

- Create a follow-up from `/followups/new`.
- Search and filter follow-ups.
- Complete a follow-up.
- Reschedule a follow-up.
- Cancel a follow-up.
- Archive a follow-up.

## Documents

- Upload a document from `/documents/new`.
- Confirm file size validation is user-friendly.
- Confirm storage limit validation is user-friendly.
- Open document detail.
- Download a document.
- Edit document metadata.
- Archive a document.

## Need Help

- Create a help request from `/need-help/new`.
- Search and filter help requests.
- Assign a help request.
- Resolve a help request.
- Reopen a help request.
- Archive a help request.

## Reports

- Open `/reports`.
- Confirm protected access requires the correct permission.
- Test filters.
- Test export actions available for the current plan and permissions.

## Team and permissions

- Open `/team`.
- Confirm current user appears in Team Members.
- Confirm users without `full_name` show an email-prefix fallback.
- Create an invite.
- Copy the invite link.
- Cancel and resend invites.
- Change a user role.
- Deactivate and reactivate a user.
- Edit role permissions.

## Subscription

- Open `/subscription`.
- Confirm plan cards remain ordered:
  - Starter
  - Professional
  - Business
  - Enterprise
- Confirm usage cards load.
- Test manual plan switching if `subscription.manage` is allowed.
- Test team invite seat limit.
- Test company creation limit.
- Test document upload limits.

## Global search

- Search company name.
- Search contact email or mobile.
- Search meeting discussion text.
- Search follow-up title.
- Search document title or file name.
- Search help request title or description.
- Confirm search dropdown closes on Escape.
- Confirm search dropdown closes on outside click.
- Confirm clicking a result opens the correct detail page.
- Confirm Enter opens `/search?q=...`.

## Notifications

- Create an action that should generate a notification.
- Confirm unread badge count updates.
- Confirm recent notifications appear in the dropdown.
- Confirm clicking a notification marks it as read.
- Confirm "Mark all as read" works.
- Confirm the dropdown stays inside the viewport on smaller screens.

## Security and tenant isolation

- Confirm protected pages redirect unauthenticated users to `/auth/login`.
- Confirm inactive users are redirected to `/unauthorized`.
- Confirm `/team` requires `team.view`.
- Confirm `/reports` requires `reports.view`.
- Confirm `/settings` requires `settings.view` or `settings.manage`.
- Confirm `/subscription` requires `subscription.view`.
- Confirm one organization cannot view another organization’s data through search, lists, reports, invites, or notifications.

## Final checks

- Run `npm run build`.
- Run `npm run typecheck`.
- Run `npm run lint`.
- Note current acceptable lint warnings if unchanged:
  - React Hook Form `watch()` compatibility warnings in the CRM form components.
