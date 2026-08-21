import Link from "next/link";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import type { SerializedLead } from "@/modules/leads/service";

export function LeadsTable({ leads }: { leads: SerializedLead[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Owner</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link href={`/leads/${lead.id}`} className="font-medium hover:underline">
                    {lead.name}
                  </Link>
                  {lead.email ? (
                    <p className="text-xs text-muted-foreground">{lead.email}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {lead.companyName ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="px-4 py-3">
                  <MoneyDisplay amount={lead.estimatedValue} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {lead.assignedTo?.name ?? "Unassigned"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <DateDisplay value={lead.createdAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {leads.map((lead) => (
          <Link
            key={lead.id}
            href={`/leads/${lead.id}`}
            className="block rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{lead.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {lead.companyName ?? lead.email ?? "No company"}
                </p>
              </div>
              <StatusBadge status={lead.status} />
            </div>
            <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
              <MoneyDisplay amount={lead.estimatedValue} />
              <span>{lead.assignedTo?.name ?? "Unassigned"}</span>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
