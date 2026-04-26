export type RecordStatus = "active" | "inactive" | "archived";
export type CompanyPriority = "low" | "medium" | "high" | "urgent";
export type LeadTemperature = "cold" | "warm" | "hot";

export type Industry = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
};

export type CompanyCategory = {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  description: string | null;
  priority_level: number;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
};

export type PipelineStage = {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  position: number;
  probability: number;
  color: string;
  is_won: boolean;
  is_lost: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Company = {
  id: string;
  organization_id: string;
  name: string;
  industry_id: string | null;
  category_id: string | null;
  lead_source: string | null;
  priority: CompanyPriority;
  assigned_user_id: string | null;
  pipeline_stage_id: string | null;
  status: RecordStatus;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  success_rating: number | null;
  lead_temperature: LeadTemperature;
  estimated_value: number | null;
  expected_closing_date: string | null;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  industries?: Pick<Industry, "id" | "name"> | null;
  company_categories?: Pick<CompanyCategory, "id" | "name" | "code"> | null;
  pipeline_stages?: Pick<PipelineStage, "id" | "name" | "color" | "probability"> | null;
  assigned_profile?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
};

export type TeamMemberOption = {
  id: string;
  full_name: string | null;
  email: string;
};

export type CompanyFilters = {
  search?: string;
  industry?: string;
  category?: string;
  pipeline?: string;
  priority?: string;
  temperature?: string;
  assigned?: string;
};
