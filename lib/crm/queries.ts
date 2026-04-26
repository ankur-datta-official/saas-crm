import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type {
  Company,
  CompanyCategory,
  CompanyFilters,
  Industry,
  PipelineStage,
  TeamMemberOption,
} from "@/lib/crm/types";

export async function getIndustries(includeArchived = false) {
  const organization = await requireOrganization();
  const supabase = await createClient();
  let query = supabase
    .from("industries")
    .select("*")
    .eq("organization_id", organization.id)
    .order("name");

  if (!includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Industry[];
}

export async function getCompanyCategories(includeArchived = false) {
  const organization = await requireOrganization();
  const supabase = await createClient();
  let query = supabase
    .from("company_categories")
    .select("*")
    .eq("organization_id", organization.id)
    .order("priority_level")
    .order("name");

  if (!includeArchived) {
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as CompanyCategory[];
}

export async function getPipelineStages(includeArchived = false) {
  const organization = await requireOrganization();
  const supabase = await createClient();
  let query = supabase
    .from("pipeline_stages")
    .select("*")
    .eq("organization_id", organization.id)
    .order("position");

  if (!includeArchived) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PipelineStage[];
}

export async function getTeamMembers() {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("organization_id", organization.id)
    .order("full_name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as TeamMemberOption[];
}

export async function getCompanies(filters: CompanyFilters = {}) {
  const organization = await requireOrganization();
  const supabase = await createClient();
  let query = supabase
    .from("companies")
    .select(
      `
      *,
      industries(id, name),
      company_categories(id, name, code),
      pipeline_stages(id, name, color, probability),
      assigned_profile:profiles!companies_assigned_user_id_fkey(id, full_name, email)
    `,
    )
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });

  if (filters.search) {
    const search = filters.search.trim();
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,website.ilike.%${search}%`);
  }

  if (filters.industry) {
    query = query.eq("industry_id", filters.industry);
  }

  if (filters.category) {
    query = query.eq("category_id", filters.category);
  }

  if (filters.pipeline) {
    query = query.eq("pipeline_stage_id", filters.pipeline);
  }

  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }

  if (filters.temperature) {
    query = query.eq("lead_temperature", filters.temperature);
  }

  if (filters.assigned) {
    query = query.eq("assigned_user_id", filters.assigned);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Company[];
}

export async function getCompanyById(id: string) {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select(
      `
      *,
      industries(id, name),
      company_categories(id, name, code),
      pipeline_stages(id, name, color, probability),
      assigned_profile:profiles!companies_assigned_user_id_fkey(id, full_name, email)
    `,
    )
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Company | null;
}

export async function getCompanyFormOptions() {
  const [industries, categories, stages, teamMembers] = await Promise.all([
    getIndustries(),
    getCompanyCategories(),
    getPipelineStages(),
    getTeamMembers(),
  ]);

  return { industries, categories, stages, teamMembers };
}

export async function getDashboardMetrics() {
  const organization = await requireOrganization();
  const supabase = await createClient();

  const [totalResult, hotResult, valueResult] = await Promise.all([
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .neq("status", "archived"),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("lead_temperature", "hot")
      .neq("status", "archived"),
    supabase
      .from("companies")
      .select("estimated_value")
      .eq("organization_id", organization.id)
      .neq("status", "archived"),
  ]);

  if (totalResult.error) throw new Error(totalResult.error.message);
  if (hotResult.error) throw new Error(hotResult.error.message);
  if (valueResult.error) throw new Error(valueResult.error.message);

  const pipelineValue = (valueResult.data ?? []).reduce(
    (total, company) => total + Number(company.estimated_value ?? 0),
    0,
  );

  return {
    totalCompanies: totalResult.count ?? 0,
    hotLeads: hotResult.count ?? 0,
    pipelineValue,
  };
}
