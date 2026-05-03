import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const DEMO_TAG = "[dashboard-demo-v1]";
const TARGET_EMAIL = process.argv[2] ?? "admin@gmail.com";

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase URL or service role key in .env.local");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const profile = await getTargetProfile(TARGET_EMAIL);
const stages = await getPipelineStages(profile.organization_id);
const selectedStages = selectFunnelStages(stages);
const categories = await getCategories(profile.organization_id);
const industries = await ensureIndustries(profile.organization_id, profile.id);
const existingDemoCount = await getExistingDemoCount(profile.organization_id);

if (existingDemoCount > 0) {
  console.log(`Demo data already exists for ${TARGET_EMAIL}. Found ${existingDemoCount} demo companies with tag ${DEMO_TAG}.`);
  process.exit(0);
}

const companiesPayload = buildCompanyPayload({
  organizationId: profile.organization_id,
  userId: profile.id,
  stageIds: selectedStages.map((stage) => stage.id),
  categoryIds: categories,
  industryIds: industries,
});

const insertedCompanies = await insertRows("companies", companiesPayload, "id, name, pipeline_stage_id");
const companyIds = insertedCompanies.map((item) => item.id);

const contactsPayload = buildContactsPayload({
  organizationId: profile.organization_id,
  userId: profile.id,
  companies: insertedCompanies,
});

const insertedContacts = await insertRows("contact_persons", contactsPayload, "id, company_id, name, email");
const contactByCompanyId = new Map(insertedContacts.map((contact) => [contact.company_id, contact]));

const interactionsPayload = buildInteractionsPayload({
  organizationId: profile.organization_id,
  userId: profile.id,
  companies: insertedCompanies,
  contactByCompanyId,
});

const insertedInteractions = await insertRows("interactions", interactionsPayload, "id, company_id");
const interactionByCompanyId = new Map(insertedInteractions.map((interaction) => [interaction.company_id, interaction]));

const followupsPayload = buildFollowupsPayload({
  organizationId: profile.organization_id,
  userId: profile.id,
  companies: insertedCompanies,
  contactByCompanyId,
  interactionByCompanyId,
});

const insertedFollowups = await insertRows("followups", followupsPayload, "id, company_id, title, status");
const pendingFollowups = insertedFollowups.filter((item) => item.status === "pending");

const helpRequestsPayload = buildHelpRequestsPayload({
  organizationId: profile.organization_id,
  userId: profile.id,
  companies: insertedCompanies,
  contactByCompanyId,
  interactionByCompanyId,
  pendingFollowups,
});

await insertRows("help_requests", helpRequestsPayload, "id");

console.log(`Seeded demo dashboard data for ${TARGET_EMAIL}`);
console.log(`Companies: ${insertedCompanies.length}`);
console.log(`Contacts: ${insertedContacts.length}`);
console.log(`Interactions: ${insertedInteractions.length}`);
console.log(`Follow-ups: ${insertedFollowups.length}`);
console.log(`Help requests: ${helpRequestsPayload.length}`);

async function getTargetProfile(email) {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, organization_id, email, full_name")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(`Unable to load profile: ${error.message}`);
  }

  if (!data?.organization_id) {
    throw new Error(`Profile ${email} was not found or does not belong to an organization yet.`);
  }

  return data;
}

async function getPipelineStages(organizationId) {
  const { data, error } = await supabase
    .from("pipeline_stages")
    .select("id, name, slug, position, is_won, is_lost, color")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .order("position");

  if (error) {
    throw new Error(`Unable to load pipeline stages: ${error.message}`);
  }

  if (!data?.length) {
    throw new Error("No active pipeline stages found for the target organization.");
  }

  return data;
}

async function getCategories(organizationId) {
  const { data, error } = await supabase
    .from("company_categories")
    .select("id")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .order("priority_level");

  if (error) {
    throw new Error(`Unable to load categories: ${error.message}`);
  }

  return (data ?? []).map((item) => item.id);
}

async function ensureIndustries(organizationId, userId) {
  const industryNames = [
    "Construction",
    "Manufacturing",
    "Power & Energy",
    "Retail",
    "Technology",
  ];

  const payload = industryNames.map((name) => ({
    organization_id: organizationId,
    name,
    description: `${name} demo industry`,
    created_by: userId,
    updated_by: userId,
  }));

  const { error: upsertError } = await supabase
    .from("industries")
    .upsert(payload, { onConflict: "organization_id,name" });

  if (upsertError) {
    throw new Error(`Unable to ensure industries: ${upsertError.message}`);
  }

  const { data, error } = await supabase
    .from("industries")
    .select("id, name")
    .eq("organization_id", organizationId)
    .in("name", industryNames);

  if (error) {
    throw new Error(`Unable to load industries: ${error.message}`);
  }

  return (data ?? []).map((item) => item.id);
}

async function getExistingDemoCount(organizationId) {
  const { count, error } = await supabase
    .from("companies")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .like("notes", `%${DEMO_TAG}%`);

  if (error) {
    throw new Error(`Unable to check existing demo data: ${error.message}`);
  }

  return count ?? 0;
}

async function insertRows(table, payload, select) {
  const { data, error } = await supabase.from(table).insert(payload).select(select);

  if (error) {
    throw new Error(`Unable to insert into ${table}: ${error.message}`);
  }

  return data ?? [];
}

function buildCompanyPayload({
  organizationId,
  userId,
  stageIds,
  categoryIds,
  industryIds,
}) {
  const counts = [25, 18, 10, 6, 3].slice(0, stageIds.length);
  const sources = ["Referral", "Website", "LinkedIn", "Phone Inquiry", "Existing Contact"];
  const priorities = ["high", "medium", "medium", "urgent", "high"];
  const temperatures = ["hot", "warm", "warm", "hot", "very_hot"];
  const cityCycle = ["Dhaka", "Chattogram", "Gazipur", "Khulna", "Sylhet"];
  const companyPrefixes = ["Build", "Acme", "Power", "Prime", "Vertex", "Summit", "Fusion", "Metro"];
  const suffixes = ["Industries", "Holdings", "Enterprises", "Solutions", "Engineering", "Traders"];

  const records = [];
  const now = new Date();
  let sequence = 1;

  for (let stageIndex = 0; stageIndex < counts.length; stageIndex += 1) {
    const count = counts[stageIndex];
    for (let itemIndex = 0; itemIndex < count; itemIndex += 1) {
      const dayOffset = (sequence * 2) % 28;
      const createdAt = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - dayOffset), 10, 0, 0);
      const prefix = companyPrefixes[(sequence - 1) % companyPrefixes.length];
      const suffix = suffixes[(sequence - 1) % suffixes.length];
      const companyName = `${prefix} ${suffix} ${sequence}`;

      records.push({
        organization_id: organizationId,
        name: companyName,
        industry_id: industryIds[(sequence - 1) % industryIds.length] ?? null,
        category_id: categoryIds[(sequence - 1) % Math.max(categoryIds.length, 1)] ?? null,
        lead_source: sources[(sequence - 1) % sources.length],
        priority: priorities[stageIndex] ?? "medium",
        assigned_user_id: userId,
        pipeline_stage_id: stageIds[stageIndex],
        status: "active",
        phone: `+8801700${String(sequence).padStart(4, "0")}`,
        email: `demo-${sequence}@crm-demo.test`,
        website: `https://demo-${sequence}.example.com`,
        city: cityCycle[(sequence - 1) % cityCycle.length],
        country: "Bangladesh",
        success_rating: Math.max(4, 9 - stageIndex),
        lead_temperature: temperatures[stageIndex] ?? "warm",
        estimated_value: 50000 + stageIndex * 85000 + itemIndex * 9000,
        expected_closing_date: new Date(now.getFullYear(), now.getMonth() + 1, ((itemIndex + 3) % 25) + 1).toISOString().slice(0, 10),
        notes: `${DEMO_TAG} Dashboard preview company for filled CRM state.`,
        created_by: userId,
        updated_by: userId,
        created_at: createdAt.toISOString(),
        updated_at: createdAt.toISOString(),
      });

      sequence += 1;
    }
  }

  return records;
}

function buildContactsPayload({ organizationId, userId, companies }) {
  return companies.map((company, index) => ({
    organization_id: organizationId,
    company_id: company.id,
    name: `Contact ${index + 1}`,
    designation: index % 3 === 0 ? "Director" : index % 3 === 1 ? "Procurement Lead" : "Operations Manager",
    department: index % 2 === 0 ? "Sales" : "Operations",
    mobile: `+8801800${String(index + 1).padStart(4, "0")}`,
    email: `contact-${index + 1}@crm-demo.test`,
    decision_role: index % 3 === 0 ? "Director" : "Influencer",
    relationship_level: index % 2 === 0 ? "Warm" : "Known",
    preferred_contact_method: index % 2 === 0 ? "Phone" : "Email",
    is_primary: true,
    status: "active",
    created_by: userId,
    updated_by: userId,
    created_at: new Date(Date.now() - index * 3600000).toISOString(),
    updated_at: new Date(Date.now() - index * 3600000).toISOString(),
  }));
}

function buildInteractionsPayload({ organizationId, userId, companies, contactByCompanyId }) {
  return companies.slice(0, 24).map((company, index) => {
    const interactionDate = new Date();
    interactionDate.setDate(interactionDate.getDate() - (index % 18));
    interactionDate.setHours(10 + (index % 6), 0, 0, 0);

    return {
      organization_id: organizationId,
      company_id: company.id,
      contact_person_id: contactByCompanyId.get(company.id)?.id ?? null,
      assigned_user_id: userId,
      interaction_type: index % 3 === 0 ? "Demo Meeting" : index % 3 === 1 ? "Phone Call" : "Quotation Discussion",
      meeting_datetime: interactionDate.toISOString(),
      discussion_details: `${DEMO_TAG} Interaction log for dashboard trend and recent activity.`,
      success_rating: 6 + (index % 4),
      lead_temperature: index % 4 === 0 ? "hot" : "warm",
      next_action: "Continue discussion and prepare commercial follow-up.",
      next_followup_at: new Date(interactionDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      need_help: index % 7 === 0,
      status: "active",
      created_by: userId,
      updated_by: userId,
      created_at: interactionDate.toISOString(),
      updated_at: interactionDate.toISOString(),
    };
  });
}

function buildFollowupsPayload({
  organizationId,
  userId,
  companies,
  contactByCompanyId,
  interactionByCompanyId,
}) {
  const now = new Date();
  const payload = [];

  companies.slice(0, 8).forEach((company, index) => {
    const scheduledAt = new Date(now);
    scheduledAt.setHours(10 + index, index % 2 === 0 ? 0 : 30, 0, 0);
    payload.push({
      organization_id: organizationId,
      company_id: company.id,
      contact_person_id: contactByCompanyId.get(company.id)?.id ?? null,
      interaction_id: interactionByCompanyId.get(company.id)?.id ?? null,
      assigned_user_id: userId,
      followup_type: "Phone Call",
      title: `Today follow-up ${index + 1}`,
      description: `${DEMO_TAG} Scheduled task for today's queue.`,
      scheduled_at: scheduledAt.toISOString(),
      reminder_before_minutes: 30,
      status: "pending",
      priority: index < 3 ? "high" : "medium",
      created_by: userId,
      updated_by: userId,
      created_at: new Date(scheduledAt.getTime() - 3 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(scheduledAt.getTime() - 3 * 60 * 60 * 1000).toISOString(),
    });
  });

  companies.slice(8, 11).forEach((company, index) => {
    const scheduledAt = new Date(now.getTime() - (index + 1) * 24 * 60 * 60 * 1000);
    scheduledAt.setHours(11, 0, 0, 0);
    payload.push({
      organization_id: organizationId,
      company_id: company.id,
      contact_person_id: contactByCompanyId.get(company.id)?.id ?? null,
      interaction_id: interactionByCompanyId.get(company.id)?.id ?? null,
      assigned_user_id: userId,
      followup_type: "Email",
      title: `Overdue follow-up ${index + 1}`,
      description: `${DEMO_TAG} Overdue task for alert state.`,
      scheduled_at: scheduledAt.toISOString(),
      reminder_before_minutes: 60,
      status: "pending",
      priority: "urgent",
      created_by: userId,
      updated_by: userId,
      created_at: new Date(scheduledAt.getTime() - 4 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(scheduledAt.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    });
  });

  companies.slice(11, 23).forEach((company, index) => {
    const scheduledAt = new Date(now.getTime() - (index + 2) * 24 * 60 * 60 * 1000);
    const completedAt = new Date(scheduledAt.getTime() + 3 * 60 * 60 * 1000);
    payload.push({
      organization_id: organizationId,
      company_id: company.id,
      contact_person_id: contactByCompanyId.get(company.id)?.id ?? null,
      interaction_id: interactionByCompanyId.get(company.id)?.id ?? null,
      assigned_user_id: userId,
      followup_type: "WhatsApp",
      title: `Completed follow-up ${index + 1}`,
      description: `${DEMO_TAG} Completed task for monthly progress.`,
      scheduled_at: scheduledAt.toISOString(),
      reminder_before_minutes: 15,
      status: "completed",
      priority: "medium",
      completed_at: completedAt.toISOString(),
      completed_by: userId,
      created_by: userId,
      updated_by: userId,
      created_at: new Date(scheduledAt.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: completedAt.toISOString(),
    });
  });

  companies.slice(23, 28).forEach((company, index) => {
    const scheduledAt = new Date(now.getTime() + (index + 1) * 24 * 60 * 60 * 1000);
    scheduledAt.setHours(14, 30, 0, 0);
    payload.push({
      organization_id: organizationId,
      company_id: company.id,
      contact_person_id: contactByCompanyId.get(company.id)?.id ?? null,
      interaction_id: interactionByCompanyId.get(company.id)?.id ?? null,
      assigned_user_id: userId,
      followup_type: "Quotation Follow-up",
      title: `Upcoming follow-up ${index + 1}`,
      description: `${DEMO_TAG} Upcoming task for future workload.`,
      scheduled_at: scheduledAt.toISOString(),
      reminder_before_minutes: 60,
      status: "pending",
      priority: "medium",
      created_by: userId,
      updated_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  });

  return payload;
}

function buildHelpRequestsPayload({
  organizationId,
  userId,
  companies,
  contactByCompanyId,
  interactionByCompanyId,
  pendingFollowups,
}) {
  return companies.slice(0, 3).map((company, index) => ({
    organization_id: organizationId,
    company_id: company.id,
    contact_person_id: contactByCompanyId.get(company.id)?.id ?? null,
    interaction_id: interactionByCompanyId.get(company.id)?.id ?? null,
    followup_id: pendingFollowups[index]?.id ?? null,
    requested_by: userId,
    assigned_to: userId,
    help_type: index === 0 ? "Need Proposal Support" : index === 1 ? "Need Price Approval" : "Need Senior Meeting",
    title: `Dashboard help request ${index + 1}`,
    description: `${DEMO_TAG} Support item for dashboard needs-support state.`,
    priority: index === 0 ? "urgent" : "high",
    status: index === 2 ? "open" : "in_progress",
    created_by: userId,
    updated_by: userId,
    created_at: new Date(Date.now() - index * 5 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - index * 5 * 60 * 60 * 1000).toISOString(),
  }));
}

function selectFunnelStages(stages) {
  const orderedStages = [...stages].sort((left, right) => left.position - right.position);
  const wonStage = orderedStages.find((stage) => stage.is_won);
  const candidates = [
    orderedStages.find((stage) => matchesStage(stage.name, ["new lead", "new", "lead"])),
    orderedStages.find((stage) => matchesStage(stage.name, ["contacted", "contact"])),
    orderedStages.find((stage) => matchesStage(stage.name, ["proposal", "requirement", "meeting done", "meeting scheduled"])),
    orderedStages.find((stage) => matchesStage(stage.name, ["negotiation"])),
    wonStage,
  ].filter(Boolean);

  const uniqueCandidates = candidates.filter(
    (stage, index, array) => array.findIndex((item) => item.id === stage.id) === index,
  );

  for (const stage of orderedStages) {
    if (!uniqueCandidates.some((candidate) => candidate.id === stage.id)) {
      uniqueCandidates.push(stage);
    }
    if (uniqueCandidates.length === 5) {
      break;
    }
  }

  return uniqueCandidates.slice(0, 5);
}

function matchesStage(name, variants) {
  const normalized = name.toLowerCase();
  return variants.some((variant) => normalized.includes(variant));
}

function loadLocalEnv() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }

  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) {
      continue;
    }
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
