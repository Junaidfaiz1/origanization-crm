import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DateDisplay } from "@/components/shared/date-display";
import type { SerializedCompany } from "@/modules/companies/service";

export function CompaniesTable({ companies }: { companies: SerializedCompany[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Industry</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Contacts</th>
              <th className="px-4 py-3 font-medium">Clients</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/companies/${company.id}`}
                    className="font-medium hover:underline"
                  >
                    {company.name}
                  </Link>
                  {company.website ? (
                    <a
                      href={company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {company.website.replace(/^https?:\/\//, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {company.industry ?? "—"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {[company.city, company.country].filter(Boolean).join(", ") || "—"}
                </td>
                <td className="px-4 py-3">{company.contactCount}</td>
                <td className="px-4 py-3">{company.clientCount}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <DateDisplay value={company.createdAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {companies.map((company) => (
          <Link
            key={company.id}
            href={`/companies/${company.id}`}
            className="block rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{company.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {company.industry ?? "No industry"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {company.clientCount} clients
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {[company.city, company.country].filter(Boolean).join(", ") || "No location"}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
