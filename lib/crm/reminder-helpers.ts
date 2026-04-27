import { createClient } from "@/lib/supabase/server";

export type DueReminder = {
  id: string;
  organization_id: string;
  title: string;
  scheduled_at: string;
  assigned_user_id: string;
  assigned_email: string;
  assigned_name: string;
  company_name: string;
};

export async function getDueFollowupReminders(): Promise<DueReminder[]> {
  const supabase = await createClient();
  const now = new Date();
  
  // Find pending followups where (scheduled_at - reminder_before_minutes) <= now
  // and no email_reminder_log exists for this followup yet.
  // We use a simplified logic here: find all pending followups due in the next hour 
  // that haven't been notified yet.
  
  const { data, error } = await supabase
    .from("followups")
    .select(`
      id,
      organization_id,
      title,
      scheduled_at,
      reminder_before_minutes,
      assigned_user_id,
      profiles!assigned_user_id (id, full_name, email),
      companies (id, name)
    `)
    .eq("status", "pending")
    .not("assigned_user_id", "is", null);

  if (error) {
    console.error("Error fetching due reminders:", error);
    return [];
  }

  const dueReminders: DueReminder[] = [];

  for (const followup of (data ?? [])) {
    const scheduledAt = new Date(followup.scheduled_at);
    const reminderBeforeMinutes = followup.reminder_before_minutes || 60;
    const reminderTime = new Date(scheduledAt.getTime() - reminderBeforeMinutes * 60000);

    if (reminderTime <= now) {
      // Check if already sent
      const { data: log } = await supabase
        .from("email_reminder_logs")
        .select("id")
        .eq("followup_id", followup.id)
        .eq("status", "sent")
        .maybeSingle();

      if (!log) {
        const profile = Array.isArray(followup.profiles) ? followup.profiles[0] : followup.profiles;
        const company = Array.isArray(followup.companies) ? followup.companies[0] : followup.companies;

        dueReminders.push({
          id: followup.id,
          organization_id: followup.organization_id,
          title: followup.title,
          scheduled_at: followup.scheduled_at,
          assigned_user_id: followup.assigned_user_id!,
          assigned_email: profile?.email || "",
          assigned_name: profile?.full_name || "User",
          company_name: company?.name || "Company",
        });
      }
    }
  }

  return dueReminders;
}

export async function logEmailReminder(
  followupId: string, 
  organizationId: string, 
  userId: string, 
  email: string, 
  status: "sent" | "failed" | "skipped", 
  errorMessage?: string
) {
  const supabase = await createClient();
  
  await supabase.from("email_reminder_logs").insert({
    organization_id: organizationId,
    followup_id: followupId,
    user_id: userId,
    email,
    status,
    provider: "foundation-stub",
    error_message: errorMessage,
    sent_at: status === "sent" ? new Date().toISOString() : null,
  });
}

export async function sendFollowupReminderEmail(reminder: DueReminder): Promise<boolean> {
  const enabled = process.env.REMINDER_EMAIL_ENABLED === "true";
  
  if (!enabled) {
    console.log(`[Email Reminder Skipped] To: ${reminder.assigned_email}, Title: ${reminder.title}`);
    await logEmailReminder(reminder.id, reminder.organization_id, reminder.assigned_user_id, reminder.assigned_email, "skipped", "Email reminders are disabled in .env");
    return true;
  }

  try {
    // In a real implementation, you would use nodemailer or a service like Resend here.
    // For now, we log the intent as per requirements.
    console.log(`[Email Reminder Sent] To: ${reminder.assigned_email}, Subject: Reminder: ${reminder.title}`);
    
    // Stub for actual email sending logic:
    // const result = await transport.sendMail({...});
    
    await logEmailReminder(reminder.id, reminder.organization_id, reminder.assigned_user_id, reminder.assigned_email, "sent");
    return true;
  } catch (error: any) {
    console.error("Failed to send reminder email:", error);
    await logEmailReminder(reminder.id, reminder.organization_id, reminder.assigned_user_id, reminder.assigned_email, "failed", error.message);
    return false;
  }
}
