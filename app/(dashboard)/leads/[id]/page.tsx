import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { getLead } from "@/modules/leads/service";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeadDetailActions } from "@/components/leads/lead-detail-actions";
import { updateLeadStatusAction } from "@/modules/leads/actions";
import { LEAD_STATUSES } from "@/modules/leads/rules";

export const metadata = { title: "Lead" };

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ converted?: string; error?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "LEAD_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to leads"
        description="Ask an owner or admin to grant LEAD_VIEW."
      />
    );
  }

  const { id } = await params;
  const query = await searchParams;

  let lead;
  try {
    lead = await getLead(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this lead"
        description="Check the database connection and try again."
      />
    );
  }

  const canUpdate = hasPermission(ctx.permissions, "LEAD_UPDATE") && !lead.archivedAt;
  const canDelete = hasPermission(ctx.permissions, "LEAD_DELETE") && !lead.archivedAt;
  const canConvert =
    canUpdate && lead.status !== "CONVERTED" && !lead.convertedClientId && !lead.archivedAt;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/leads" className="text-sm text-muted-foreground hover:text-foreground">
            ← Leads
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{lead.name}</h1>
            <StatusBadge status={lead.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {lead.companyName ?? "No company"} · Created <DateDisplay value={lead.createdAt} />
          </p>
        </div>
        <LeadDetailActions
          leadId={lead.id}
          canUpdate={canUpdate}
          canDelete={canDelete}
          canConvert={canConvert}
        />
      </div>

      {query.converted === "1" ? (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          Lead converted. A company, contact, client, and opportunity were created.
        </p>
      ) : null}
      {query.error === "convert" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-destructive dark:border-red-900 dark:bg-red-950/40">
          This lead could not be converted. It may already be converted or archived.
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" value={lead.email} />
            <Field label="Phone" value={lead.phone} />
            <Field label="Source" value={lead.source} />
            <div>
              <p className="text-xs text-muted-foreground">Estimated value</p>
              <MoneyDisplay amount={lead.estimatedValue} />
            </div>
            <Field label="Owner" value={lead.assignedTo?.name ?? "Unassigned"} />
            {lead.convertedClientId ? (
              <Field label="Converted client" value={lead.convertedClientId} />
            ) : null}
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{lead.notes ?? "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            {canUpdate && lead.status !== "CONVERTED" ? (
              <form action={updateLeadStatusAction} className="space-y-3">
                <input type="hidden" name="id" value={lead.id} />
                <select
                  name="status"
                  defaultValue={lead.status}
                  className="flex h-11 w-full rounded-md border border-input bg-card px-3 text-base md:h-10 md:text-sm"
                >
                  {LEAD_STATUSES.filter((status) => status !== "CONVERTED").map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Update status
                </button>
              </form>
            ) : (
              <StatusBadge status={lead.status} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm">{value || "—"}</p>
    </div>
  );
}
