import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedProposal } from "@/modules/proposals/service";

export function ProposalsTable({ proposals }: { proposals: SerializedProposal[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Proposal</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Valid until</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {proposals.map((proposal) => (
              <tr key={proposal.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link href={`/proposals/${proposal.id}`} className="font-medium hover:underline">
                    {proposal.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {proposal.opportunity.name}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/clients/${proposal.clientId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {proposal.client.companyName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={proposal.status} />
                </td>
                <td className="px-4 py-3">
                  <MoneyDisplay amount={proposal.total} currency={proposal.currency} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <DateDisplay value={proposal.validUntil} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <DateDisplay value={proposal.updatedAt} />
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
            href={`/proposals/${proposal.id}`}
            className="block rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{proposal.title}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {proposal.client.companyName}
                </p>
              </div>
              <StatusBadge status={proposal.status} />
            </div>
            <p className="mt-2 text-sm">
              <MoneyDisplay amount={proposal.total} currency={proposal.currency} />
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
