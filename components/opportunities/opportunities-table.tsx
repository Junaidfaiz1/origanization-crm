import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedOpportunity } from "@/modules/opportunities/service";

export function OpportunitiesTable({
  opportunities,
}: {
  opportunities: SerializedOpportunity[];
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Deal</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Weighted</th>
              <th className="px-4 py-3 font-medium">Close</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {opportunities.map((opportunity) => (
              <tr key={opportunity.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/opportunities/${opportunity.id}`}
                    className="font-medium hover:underline"
                  >
                    {opportunity.name}
                  </Link>
                  {opportunity.assignedTo ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {opportunity.assignedTo.name}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/clients/${opportunity.clientId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {opportunity.client.companyName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={opportunity.stage} />
                </td>
                <td className="px-4 py-3">
                  <MoneyDisplay amount={opportunity.estimatedValue} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <MoneyDisplay amount={opportunity.weightedValue} />
                  <span className="ml-1 text-xs">({opportunity.probability}%)</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {opportunity.expectedCloseDate ? (
                    <DateDisplay value={opportunity.expectedCloseDate} />
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {opportunities.map((opportunity) => (
          <Link
            key={opportunity.id}
            href={`/opportunities/${opportunity.id}`}
            className="block rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{opportunity.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {opportunity.client.companyName}
                </p>
              </div>
              <StatusBadge status={opportunity.stage} />
            </div>
            <p className="mt-2 text-sm">
              <MoneyDisplay amount={opportunity.estimatedValue} /> ·{" "}
              {opportunity.probability}% weighted
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
