import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedTeamMember } from "@/modules/team/service";

export function TeamTable({
  members,
  showRates,
}: {
  members: SerializedTeamMember[];
  showRates: boolean;
}) {
  const columns: DataTableColumn<SerializedTeamMember>[] = [
    {
      id: "member",
      header: "Member",
      cell: (member) => (
        <>
          <Link href={`/team/${member.id}`} className="font-medium hover:underline">
            {member.resource.user.name}
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">{member.resource.user.email}</p>
        </>
      ),
    },
    {
      id: "project",
      header: "Project",
      cell: (member) => (
        <Link
          href={`/projects/${member.projectId}`}
          className="text-muted-foreground hover:text-foreground hover:underline"
        >
          {member.project.name}
        </Link>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: (member) => <StatusBadge status={member.resource.type} />,
    },
    {
      id: "role",
      header: "Role",
      className: "text-muted-foreground",
      cell: (member) => member.role ?? "—",
    },
    ...(showRates
      ? [
          {
            id: "rate",
            header: "Rate",
            cell: (member: SerializedTeamMember) => (
              <MoneyDisplay amount={member.resource.hourlyRate} />
            ),
          } satisfies DataTableColumn<SerializedTeamMember>,
        ]
      : []),
    {
      id: "assigned",
      header: "Assigned",
      className: "text-muted-foreground",
      cell: (member) => <DateDisplay value={member.assignedAt} />,
    },
  ];

  return (
    <DataTable
      rows={members}
      columns={columns}
      rowKey={(member) => member.id}
      caption="Team assignments"
      minWidthClassName="min-w-[48rem]"
      mobileRow={(member) => (
        <Link
          href={`/team/${member.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{member.resource.user.name}</p>
              <p className="truncate text-sm text-muted-foreground">{member.project.name}</p>
            </div>
            <StatusBadge status={member.resource.type} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{member.role ?? "No role"}</p>
        </Link>
      )}
    />
  );
}
