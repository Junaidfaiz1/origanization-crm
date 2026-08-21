import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedClient } from "@/modules/clients/service";

export function ClientsTable({ clients }: { clients: SerializedClient[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Primary contact</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Opportunities</th>
              <th className="px-4 py-3 font-medium">Projects</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/clients/${client.id}`}
                    className="font-medium hover:underline"
                  >
                    {client.company.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {client.primaryContact ? (
                    <Link
                      href={`/contacts/${client.primaryContact.id}`}
                      className="hover:text-foreground hover:underline"
                    >
                      {client.primaryContact.name}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={client.status} />
                </td>
                <td className="px-4 py-3">{client.opportunityCount}</td>
                <td className="px-4 py-3">{client.projectCount}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <DateDisplay value={client.createdAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {clients.map((client) => (
          <Link
            key={client.id}
            href={`/clients/${client.id}`}
            className="block rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{client.company.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {client.primaryContact?.name ?? "No primary contact"}
                </p>
              </div>
              <StatusBadge status={client.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {client.opportunityCount} opportunities · {client.projectCount} projects
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
