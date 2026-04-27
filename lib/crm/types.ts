export type RecordStatus = "active" | "inactive" | "archived";

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
  code: string | null;
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
  color: string;
  probability: number;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type LeadTemperature = "cold" | "warm" | "hot" | "very_hot";

export type CompanyPriority = "low" | "medium" | "high" | "urgent";

export type InteractionType =
  | "Phone Call"
  | "Physical Meeting"
  | "Online Meeting"
  | "WhatsApp Discussion"
  | "Email Follow-up"
  | "Demo Meeting"
  | "Technical Meeting"
  | "Quotation Discussion"
  | "Payment Discussion"
  | "Closing Meeting"
  | "Other";

export type DecisionRole =
  | "Owner"
  | "CEO / MD"
  | "Director"
  | "Procurement"
  | "IT Head"
  | "Admin"
  | "Engineer"
  | "Finance"
  | "Influencer"
  | "Gatekeeper"
  | "Other";

export type RelationshipLevel =
  | "New"
  | "Known"
  | "Warm"
  | "Strong"
  | "Decision Maker"
  | "Risky"
  | "Inactive";

export type PreferredContactMethod =
  | "Phone"
  | "WhatsApp"
  | "Email"
  | "LinkedIn"
  | "Physical Meeting";

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
  pipeline_stages?: Pick<PipelineStage, "id" | "name" | "color"> | null;
  assigned_profile?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  created_profile?: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  primary_contact?: Pick<ContactPerson, "id" | "name" | "mobile" | "email" | "designation"> | null;
};

export type ContactPerson = {
  id: string;
  organization_id: string;
  company_id: string;
  name: string;
  designation: string | null;
  department: string | null;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  linkedin: string | null;
  decision_role: DecisionRole | null;
  relationship_level: RelationshipLevel | null;
  preferred_contact_method: PreferredContactMethod | null;
  remarks: string | null;
  is_primary: boolean;
  status: RecordStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  companies?: Pick<Company, "id" | "name" | "phone" | "email"> | null;
  created_profile?: {
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

export type ContactFilters = {
  search?: string;
  company?: string;
  decisionRole?: string;
  relationshipLevel?: string;
  preferredMethod?: string;
  status?: string;
};

export type Interaction = {
  id: string;
  organization_id: string;
  company_id: string;
  contact_person_id: string | null;
  assigned_user_id: string | null;
  interaction_type: InteractionType;
  meeting_datetime: string;
  location: string | null;
  online_meeting_link: string | null;
  discussion_details: string;
  client_requirement: string | null;
  pain_point: string | null;
  proposed_solution: string | null;
  budget_discussion: string | null;
  competitor_mentioned: string | null;
  decision_timeline: string | null;
  success_rating: number | null;
  lead_temperature: LeadTemperature | null;
  next_action: string | null;
  next_followup_at: string | null;
  need_help: boolean;
  internal_note: string | null;
  status: RecordStatus;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  companies?: Pick<Company, "id" | "name"> | null;
  contact_persons?: Pick<ContactPerson, "id" | "name" | "mobile" | "email"> | null;
  assigned_profile?: TeamMemberOption | null;
  created_profile?: TeamMemberOption | null;
};

export type InteractionFilters = {
  search?: string;
  company?: string;
  contact?: string;
  type?: string;
  ratingMin?: string;
  ratingMax?: string;
  temperature?: string;
  assigned?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
};

export type FollowupType =
  | "Phone Call"
  | "Email"
  | "WhatsApp"
  | "Physical Meeting"
  | "Online Meeting"
  | "Quotation Follow-up"
  | "Payment Follow-up"
  | "Technical Follow-up"
  | "Demo Follow-up"
  | "Decision Follow-up"
  | "Other";

export type FollowupStatus = "pending" | "completed" | "rescheduled" | "cancelled" | "archived";

export type FollowupPriority = "low" | "medium" | "high" | "urgent";

export type Followup = {
  id: string;
  organization_id: string;
  company_id: string;
  contact_person_id: string | null;
  interaction_id: string | null;
  assigned_user_id: string | null;
  followup_type: FollowupType;
  title: string;
  description: string | null;
  scheduled_at: string;
  reminder_before_minutes: number;
  status: FollowupStatus;
  priority: FollowupPriority;
  completed_at: string | null;
  completed_by: string | null;
  rescheduled_from: string | null;
  cancelled_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  companies?: Pick<Company, "id" | "name"> | null;
  contact_persons?: Pick<ContactPerson, "id" | "name" | "mobile" | "email"> | null;
  interactions?: Pick<Interaction, "id" | "interaction_type" | "meeting_datetime"> | null;
  assigned_profile?: TeamMemberOption | null;
  created_profile?: TeamMemberOption | null;
};

export type FollowupFilters = {
  search?: string;
  company?: string;
  contact?: string;
  assigned?: string;
  type?: string;
  priority?: string;
  status?: string;
  dateStart?: string;
  dateEnd?: string;
};
