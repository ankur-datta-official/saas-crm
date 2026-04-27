import { notFound } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  User, 
  MessageSquare, 
  Calendar, 
  Clock, 
  UserPlus, 
  AlertCircle,
  FileText,
  History
} from "lucide-react";
import { getFollowupById } from "@/lib/crm/followup-queries";
import { FollowupDetailHeader } from "@/components/crm/followup-detail-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const followup = await getFollowupById(id);
  return {
    title: followup ? `${followup.title} | Follow-up` : "Follow-up Details",
  };
}

export default async function FollowupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const followup = await getFollowupById(id);

  if (!followup) {
    notFound();
  }

  return (
    <div className="container py-6">
      <FollowupDetailHeader followup={followup} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Description & Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              {followup.description ? (
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {followup.description}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">No description provided.</p>
              )}
            </CardContent>
          </Card>

          {(followup.completed_at || followup.rescheduled_from || followup.cancelled_reason) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {followup.completed_at && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-emerald-100 p-1 text-emerald-600">
                      <Clock className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-emerald-900">Completed</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(followup.completed_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {followup.rescheduled_from && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-amber-100 p-1 text-amber-600">
                      <Calendar className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-amber-900">Rescheduled from</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(followup.rescheduled_from).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {followup.cancelled_reason && (
                  <div className="flex items-start gap-3">
                    <div className="mt-1 rounded-full bg-rose-100 p-1 text-rose-600">
                      <AlertCircle className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-rose-900">Cancelled Reason</p>
                      <p className="text-xs text-muted-foreground">{followup.cancelled_reason}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Context</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Company</p>
                    <Link 
                      href={`/companies/${followup.company_id}`}
                      className="text-sm font-medium hover:text-primary hover:underline"
                    >
                      {followup.companies?.name}
                    </Link>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Contact Person</p>
                    {followup.contact_persons ? (
                      <Link 
                        href={`/contacts/${followup.contact_person_id}`}
                        className="text-sm font-medium hover:text-primary hover:underline"
                      >
                        {followup.contact_persons.name}
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">None</p>
                    )}
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <MessageSquare className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Related Meeting</p>
                    {followup.interactions ? (
                      <Link 
                        href={`/meetings/${followup.interaction_id}`}
                        className="text-sm font-medium hover:text-primary hover:underline"
                      >
                        {followup.interactions.interaction_type} - {new Date(followup.interactions.meeting_datetime).toLocaleDateString()}
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">None</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Assignment & Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Assigned To:</span>
                <span className="font-medium">{followup.assigned_profile?.full_name ?? followup.assigned_profile?.email ?? "Unassigned"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reminder:</span>
                <span className="font-medium">{followup.reminder_before_minutes} mins before</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created By:</span>
                <span className="text-xs">{followup.created_profile?.full_name ?? followup.created_profile?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created At:</span>
                <span className="text-xs">{new Date(followup.created_at).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
