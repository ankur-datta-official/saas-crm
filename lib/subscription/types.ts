export type SubscriptionFeatureCode =
  | "custom_pipeline"
  | "pdf_export"
  | "csv_import"
  | "advanced_reports"
  | "audit_log";

export type SubscriptionLimitType =
  | "users"
  | "companies"
  | "storage"
  | "file_size"
  | SubscriptionFeatureCode;

export type SubscriptionPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  monthly_price: number;
  max_users: number | null;
  max_organizations: number;
  max_companies: number | null;
  storage_limit_mb: number | null;
  file_size_limit_mb: number | null;
  custom_pipeline: boolean;
  pdf_export: boolean;
  csv_import: boolean;
  advanced_reports: boolean;
  audit_log: boolean;
  is_active: boolean;
};

export type OrganizationSubscription = {
  id: string;
  organization_id: string;
  plan_id: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "expired";
  trial_starts_at: string;
  trial_ends_at: string;
  current_period_starts_at: string | null;
  current_period_ends_at: string | null;
  created_at: string;
  updated_at: string;
  plan: SubscriptionPlan | null;
};

export type OrganizationUsage = {
  activeUsers: number;
  pendingInvitations: number;
  reservedSeats: number;
  companies: number;
  storageUsedMb: number;
};

export type SubscriptionLimitCheck = {
  allowed: boolean;
  current: number;
  projected: number;
  max: number | null;
  message: string | null;
};
