import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedContract } from "@/modules/contracts/service";

export function ContractsTable({ contracts }: { contracts: SerializedContract[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Contract</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Resource</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {contracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/contracts/${contract.id}`}
                    className="font-medium hover:underline"
                  >
                    {contract.title}
                  </Link>
                  {contract.startDate ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Starts <DateDisplay value={contract.startDate} />
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${contract.projectId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {contract.project.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{contract.client.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {contract.resource?.name ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <MoneyDisplay amount={contract.totalAmount} currency={contract.currency} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={contract.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {contracts.map((contract) => (
          <Link
            key={contract.id}
            href={`/contracts/${contract.id}`}
            className="block rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{contract.title}</p>
                <p className="truncate text-sm text-muted-foreground">{contract.project.name}</p>
              </div>
              <StatusBadge status={contract.status} />
            </div>
            <p className="mt-2 text-sm">
              <MoneyDisplay amount={contract.totalAmount} currency={contract.currency} />
              {" · "}
              {contract.client.name}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
