import Link from "next/link";
import { requirePortalUser } from "@/lib/auth/page";
import { getPortalHome } from "@/modules/client-portal/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

export const metadata = { title: "Client portal" };

export default async function PortalHomePage() {
  const ctx = await requirePortalUser();

  let home;
  try {
    home = await getPortalHome(ctx);
  } catch {
    return (
      <ErrorState
        title="Could not load portal"
        description="Check that your account is linked to a client profile."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground">Welcome</p>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          {home.client.companyName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View proposals, project progress, invoices, and payments. Bidding and
          internal costs stay with the agency.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Proposals" value={String(home.counts.proposals)} href="/portal/proposals" />
        <Stat label="Projects" value={String(home.counts.projects)} href="/portal/projects" />
        <Stat label="Invoices" value={String(home.counts.invoices)} href="/portal/invoices" />
        <Stat
          label="Outstanding"
          value={String(home.counts.outstandingInvoices)}
          href="/portal/invoices"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Action needed</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {home.actionableProposals.length === 0 ? (
              <EmptyState
                title="No proposals waiting"
                description="When the agency sends a proposal, it will appear here."
              />
            ) : (
              home.actionableProposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  href={`/portal/proposals/${proposal.id}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border p-3 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{proposal.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <MoneyDisplay amount={proposal.total} currency={proposal.currency} />
                    </p>
                  </div>
                  <StatusBadge status={proposal.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {home.recentInvoices.length === 0 ? (
              <EmptyState
                title="No invoices yet"
                description="Sent invoices will show here with balances due."
              />
            ) : (
              home.recentInvoices.map((invoice) => (
                <Link
                  key={invoice.id}
                  href={`/portal/invoices/${invoice.id}`}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border p-3 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Due <MoneyDisplay amount={invoice.amountDue} currency={invoice.currency} />
                      {" · "}
                      <DateDisplay value={invoice.issueDate} />
                    </p>
                  </div>
                  <StatusBadge status={invoice.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-border bg-card p-4 hover:bg-muted/40"
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </Link>
  );
}
