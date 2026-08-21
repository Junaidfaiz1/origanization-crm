import Link from "next/link";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedResource } from "@/modules/resources/service";

const columns: DataTableColumn<SerializedResource>[] = [
  {
    id: "name",
    header: "Name",
    cell: (resource) => (
      <>
        <Link
          href={`/resources/${resource.id}`}
          className="font-medium hover:underline"
        >
          {resource.user.name}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">{resource.user.email}</p>
      </>
    ),
  },
  {
    id: "type",
    header: "Type",
    cell: (resource) => <StatusBadge status={resource.type} />,
  },
  {
    id: "availability",
    header: "Availability",
    cell: (resource) => <StatusBadge status={resource.availabilityStatus} />,
  },
  {
    id: "rate",
    header: "Rate",
    cell: (resource) =>
      resource.hourlyRate ? (
        <>
          <MoneyDisplay amount={resource.hourlyRate} />/hr
        </>
      ) : (
        "—"
      ),
  },
  {
    id: "experience",
    header: "Experience",
    className: "text-muted-foreground",
    cell: (resource) => (
      <>
        {resource.experienceYears ?? "—"}
        {resource.rating ? (
          <span className="ml-2 text-xs">★ {resource.rating}</span>
        ) : null}
      </>
    ),
  },
  {
    id: "skills",
    header: "Skills",
    className: "text-muted-foreground",
    cell: (resource) =>
      resource.skills.length > 0
        ? resource.skills.map((skill) => skill.name).join(", ")
        : "—",
  },
];

export function ResourcesTable({ resources }: { resources: SerializedResource[] }) {
  return (
    <DataTable
      rows={resources}
      columns={columns}
      rowKey={(resource) => resource.id}
      caption="Resources"
      minWidthClassName="min-w-[52rem]"
      mobileRow={(resource) => (
        <Link
          href={`/resources/${resource.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{resource.user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{resource.user.email}</p>
            </div>
            <StatusBadge status={resource.availabilityStatus} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            <StatusBadge status={resource.type} />
            {resource.hourlyRate ? (
              <>
                {" · "}
                <MoneyDisplay amount={resource.hourlyRate} />/hr
              </>
            ) : null}
          </p>
        </Link>
      )}
    />
  );
}
