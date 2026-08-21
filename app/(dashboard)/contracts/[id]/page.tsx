import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError, AuthorizationError } from "@/lib/errors/app-error";
import { DateDisplay } from "@/components/shared/date-display";
import { ErrorState } from "@/components/shared/error-state";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContractDetailActions } from "@/components/contracts/contract-detail-actions";
import { getContract } from "@/modules/contracts/service";

export const metadata = { title: "Contract" };

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "CONTRACT_VIEW")) {
    return (
      <ErrorState
        title="You don’t have access to contracts"
        description="Ask a project manager to grant CONTRACT_VIEW."
      />
    );
  }

  const { id } = await params;

  let contract;
  try {
    contract = await getContract(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    if (error instanceof AuthorizationError) {
      return (
        <ErrorState title="You cannot view this contract" description={error.message} />
      );
    }
    return (
      <ErrorState
        title="Could not load this contract"
        description="Check the database connection and try again."
      />
    );
  }

  const canUpdate =
    hasPermission(ctx.permissions, "CONTRACT_CREATE") &&
    ["DRAFT", "SENT"].includes(contract.status);
  const canManageStatus = hasPermission(ctx.permissions, "CONTRACT_UPDATE");
  const canDelete =
    hasPermission(ctx.permissions, "CONTRACT_CREATE") && contract.status === "DRAFT";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link href="/contracts" className="text-sm text-muted-foreground hover:text-foreground">
            ← Contracts
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{contract.title}</h1>
            <StatusBadge status={contract.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              href={`/projects/${contract.projectId}`}
              className="hover:text-foreground hover:underline"
            >
              {contract.project.name}
            </Link>
            {" · "}
            {contract.client.name}
          </p>
        </div>
        <ContractDetailActions
          contractId={contract.id}
          status={contract.status}
          canUpdate={canUpdate}
          canManageStatus={canManageStatus}
          canDelete={canDelete}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Terms</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Total amount">
              <MoneyDisplay amount={contract.totalAmount} currency={contract.currency} />
            </Field>
            <Field label="Status">
              <StatusBadge status={contract.status} />
            </Field>
            <Field label="Start date">
              {contract.startDate ? <DateDisplay value={contract.startDate} /> : "—"}
            </Field>
            <Field label="End date">
              {contract.endDate ? <DateDisplay value={contract.endDate} /> : "—"}
            </Field>
            <Field label="Signed">
              {contract.signedAt ? <DateDisplay value={contract.signedAt} /> : "—"}
            </Field>
            <Field label="Updated">
              <DateDisplay value={contract.updatedAt} />
            </Field>
            <Field label="Content" className="sm:col-span-2">
              {contract.content ? (
                <pre className="whitespace-pre-wrap rounded-lg bg-muted/40 p-3 text-xs leading-relaxed">
                  {contract.content}
                </pre>
              ) : (
                "—"
              )}
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Project</span>
              <Link href={`/projects/${contract.projectId}`} className="font-medium hover:underline">
                {contract.project.name}
              </Link>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Client</span>
              <span className="font-medium">{contract.client.name}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Resource</span>
              <span className="font-medium">{contract.resource?.name ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground">Linked bid</span>
              <span className="font-medium">
                {contract.bid ? (
                  <>
                    <MoneyDisplay amount={contract.bid.amount} currency={contract.currency} />
                    {" · "}
                    {contract.bid.status.toLowerCase()}
                  </>
                ) : (
                  "—"
                )}
              </span>
            </div>
            {contract.status === "DRAFT" ? (
              <p className="text-xs text-muted-foreground">
                Draft contracts can be edited or sent when terms are ready.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}
