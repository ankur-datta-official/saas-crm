import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_SECTION_LIMIT = 5;

export type SearchResultType =
  | "company"
  | "contact"
  | "meeting"
  | "followup"
  | "document"
  | "help_request";

export type GlobalSearchItem = {
  id: string;
  type: SearchResultType;
  title: string;
  subtitle: string;
  href: string;
  badge: string | null;
  status?: string | null;
};

export type GlobalSearchResults = {
  companies: GlobalSearchItem[];
  contacts: GlobalSearchItem[];
  meetings: GlobalSearchItem[];
  followups: GlobalSearchItem[];
  documents: GlobalSearchItem[];
  helpRequests: GlobalSearchItem[];
};

function createEmptyResults(): GlobalSearchResults {
  return {
    companies: [],
    contacts: [],
    meetings: [],
    followups: [],
    documents: [],
    helpRequests: [],
  };
}

function normalizeQuery(query: string) {
  return query.trim();
}

function hasEnoughQuery(query: string) {
  return normalizeQuery(query).length >= 2;
}

function getRelationName(value: unknown) {
  if (Array.isArray(value)) {
    const firstValue = value[0] as { name?: string } | undefined;
    return firstValue?.name ?? null;
  }

  if (value && typeof value === "object" && "name" in value) {
    return (value as { name?: string }).name ?? null;
  }

  return null;
}

export async function searchCompanies(query: string, limit = DEFAULT_SECTION_LIMIT): Promise<GlobalSearchItem[]> {
  const normalizedQuery = normalizeQuery(query);
  if (!hasEnoughQuery(normalizedQuery)) {
    return [];
  }

  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name, email, phone, website, status")
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .or(`name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%,phone.ilike.%${normalizedQuery}%,website.ilike.%${normalizedQuery}%`)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((company) => ({
    id: company.id,
    type: "company" as const,
    title: company.name,
    subtitle: company.email ?? company.phone ?? company.website ?? "Company record",
    href: `/companies/${company.id}`,
    badge: company.status,
    status: company.status,
  }));
}

export async function searchContacts(query: string, limit = DEFAULT_SECTION_LIMIT): Promise<GlobalSearchItem[]> {
  const normalizedQuery = normalizeQuery(query);
  if (!hasEnoughQuery(normalizedQuery)) {
    return [];
  }

  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_persons")
    .select("id, name, email, mobile, designation, status, companies(name)")
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .or(`name.ilike.%${normalizedQuery}%,email.ilike.%${normalizedQuery}%,mobile.ilike.%${normalizedQuery}%,designation.ilike.%${normalizedQuery}%`)
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((contact) => ({
    id: contact.id,
    type: "contact" as const,
    title: contact.name,
    subtitle: contact.email ?? contact.mobile ?? contact.designation ?? getRelationName(contact.companies) ?? "Contact record",
    href: `/contacts/${contact.id}`,
    badge: contact.designation ?? contact.status,
    status: contact.status,
  }));
}

export async function searchInteractions(query: string, limit = DEFAULT_SECTION_LIMIT): Promise<GlobalSearchItem[]> {
  const normalizedQuery = normalizeQuery(query);
  if (!hasEnoughQuery(normalizedQuery)) {
    return [];
  }

  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interactions")
    .select("id, interaction_type, discussion_details, next_action, status, companies(name)")
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .or(`discussion_details.ilike.%${normalizedQuery}%,next_action.ilike.%${normalizedQuery}%`)
    .order("meeting_datetime", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((meeting) => ({
    id: meeting.id,
    type: "meeting" as const,
    title: getRelationName(meeting.companies) ? `${getRelationName(meeting.companies)} meeting` : meeting.interaction_type,
    subtitle: meeting.discussion_details ?? meeting.next_action ?? "Interaction record",
    href: `/meetings/${meeting.id}`,
    badge: meeting.interaction_type,
    status: meeting.status,
  }));
}

export async function searchFollowups(query: string, limit = DEFAULT_SECTION_LIMIT): Promise<GlobalSearchItem[]> {
  const normalizedQuery = normalizeQuery(query);
  if (!hasEnoughQuery(normalizedQuery)) {
    return [];
  }

  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("followups")
    .select("id, title, description, status, priority, companies(name)")
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .or(`title.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`)
    .order("scheduled_at", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((followup) => ({
    id: followup.id,
    type: "followup" as const,
    title: followup.title,
    subtitle: followup.description ?? getRelationName(followup.companies) ?? "Follow-up record",
    href: `/followups/${followup.id}`,
    badge: followup.priority ?? followup.status,
    status: followup.status,
  }));
}

export async function searchDocuments(query: string, limit = DEFAULT_SECTION_LIMIT): Promise<GlobalSearchItem[]> {
  const normalizedQuery = normalizeQuery(query);
  if (!hasEnoughQuery(normalizedQuery)) {
    return [];
  }

  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, file_name, remarks, status, document_type, companies(name)")
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .or(`title.ilike.%${normalizedQuery}%,file_name.ilike.%${normalizedQuery}%,remarks.ilike.%${normalizedQuery}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((document) => ({
    id: document.id,
    type: "document" as const,
    title: document.title,
    subtitle: document.file_name ?? document.remarks ?? getRelationName(document.companies) ?? "Document record",
    href: `/documents/${document.id}`,
    badge: document.document_type ?? document.status,
    status: document.status,
  }));
}

export async function searchHelpRequests(query: string, limit = DEFAULT_SECTION_LIMIT): Promise<GlobalSearchItem[]> {
  const normalizedQuery = normalizeQuery(query);
  if (!hasEnoughQuery(normalizedQuery)) {
    return [];
  }

  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("help_requests")
    .select("id, title, description, status, help_type, companies(name)")
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .or(`title.ilike.%${normalizedQuery}%,description.ilike.%${normalizedQuery}%`)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((request) => ({
    id: request.id,
    type: "help_request" as const,
    title: request.title,
    subtitle: request.description ?? getRelationName(request.companies) ?? "Help request",
    href: `/need-help/${request.id}`,
    badge: request.help_type ?? request.status,
    status: request.status,
  }));
}

export async function globalSearch(query: string, limit = DEFAULT_SECTION_LIMIT): Promise<GlobalSearchResults> {
  const normalizedQuery = normalizeQuery(query);
  if (!hasEnoughQuery(normalizedQuery)) {
    return createEmptyResults();
  }

  const [companies, contacts, meetings, followups, documents, helpRequests] = await Promise.all([
    searchCompanies(normalizedQuery, limit),
    searchContacts(normalizedQuery, limit),
    searchInteractions(normalizedQuery, limit),
    searchFollowups(normalizedQuery, limit),
    searchDocuments(normalizedQuery, limit),
    searchHelpRequests(normalizedQuery, limit),
  ]);

  return {
    companies,
    contacts,
    meetings,
    followups,
    documents,
    helpRequests,
  };
}
