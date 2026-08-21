import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { DateDisplay } from "@/components/shared/date-display";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedCompany } from "@/modules/companies/service";

const columns: DataTableColumn<SerializedCompany>[] = [
  {
    id: "company",
    header: "Company",
    cell: (company) => (
      <>
        <Link href={`/companies/${company.id}`} className="font-medium hover:underline">
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
            <ExternalLink className="h-3 w-3" aria-hidden />
            <span className="sr-only">(opens in new tab)</span>
          </a>
        ) : null}
      </>
    ),
  },
  {
    id: "industry",
    header: "Industry",
    className: "text-muted-foreground",
    cell: (company) => company.industry ?? "—",
  },
  {
    id: "location",
    header: "Location",
    className: "text-muted-foreground",
    cell: (company) =>
      [company.city, company.country].filter(Boolean).join(", ") || "—",
  },
  {
    id: "contacts",
    header: "Contacts",
    cell: (company) => company.contactCount,
  },
  {
    id: "clients",
    header: "Clients",
    cell: (company) => company.clientCount,
  },
  {
    id: "created",
    header: "Created",
    className: "text-muted-foreground",
    cell: (company) => <DateDisplay value={company.createdAt} />,
  },
];

export function CompaniesTable({ companies }: { companies: SerializedCompany[] }) {
  return (
    <DataTable
      rows={companies}
      columns={columns}
      rowKey={(company) => company.id}
      caption="Companies"
      mobileRow={(company) => (
        <Link
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
      )}
    />
  );
}
