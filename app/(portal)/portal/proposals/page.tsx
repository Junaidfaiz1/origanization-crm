import Link from "next/link";
import { requirePortalUser } from "@/lib/auth/page";
import { listPortalProposals } from "@/modules/client-portal/service";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";

export const metadata = { title: "Proposals" };

export default async function PortalProposalsPage() {
  const ctx = await requirePortalUser();

  let proposals;
  try {
    proposals = await listPortalProposals(ctx);
  } catch {
    return (
      <ErrorState
        title="Could not load proposals"
        description="Try again in a moment."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Proposals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and respond to proposals sent by the agency.
        </p>
      </div>

      {proposals.length === 0 ? (
        <EmptyState
          title="No proposals yet"
          description="Sent proposals will appear here for review."
        />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Proposal</th>
                  <th className="px-4 py-3 font-medium">Opportunity</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {proposals.map((proposal) => (
                  <tr key={proposal.id} className="hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <Link
                        href={`/portal/proposals/${proposal.id}`}
                        className="font-medium hover:underline"
                      >
                        {proposal.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {proposal.opportunityName}
                    </td>
                    <td className="px-4 py-3">
                      <MoneyDisplay amount={proposal.total} currency={proposal.currency} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={proposal.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {proposals.map((proposal) => (
              <Link
                key={proposal.id}
                href={`/portal/proposals/${proposal.id}`}
                className="block rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="truncate font-medium">{proposal.title}</p>
                  <StatusBadge status={proposal.status} />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  <MoneyDisplay amount={proposal.total} currency={proposal.currency} />
                </p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
