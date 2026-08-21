import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedContact } from "@/modules/contacts/service";

const columns: DataTableColumn<SerializedContact>[] = [
  {
    id: "contact",
    header: "Contact",
    cell: (contact) => (
      <>
        <Link href={`/contacts/${contact.id}`} className="font-medium hover:underline">
          {contact.name}
        </Link>
        {contact.designation ? (
          <p className="mt-1 text-xs text-muted-foreground">{contact.designation}</p>
        ) : null}
      </>
    ),
  },
  {
    id: "company",
    header: "Company",
    cell: (contact) => (
      <Link
        href={`/companies/${contact.company.id}`}
        className="text-muted-foreground hover:text-foreground hover:underline"
      >
        {contact.company.name}
      </Link>
    ),
  },
  {
    id: "email",
    header: "Email",
    className: "text-muted-foreground",
    cell: (contact) => contact.email ?? "—",
  },
  {
    id: "phone",
    header: "Phone",
    className: "text-muted-foreground",
    cell: (contact) => contact.phone ?? "—",
  },
  {
    id: "created",
    header: "Created",
    className: "text-muted-foreground",
    cell: (contact) => <DateDisplay value={contact.createdAt} />,
  },
];

export function ContactsTable({ contacts }: { contacts: SerializedContact[] }) {
  return (
    <DataTable
      rows={contacts}
      columns={columns}
      rowKey={(contact) => contact.id}
      caption="Contacts"
      minWidthClassName="min-w-[44rem]"
      mobileRow={(contact) => (
        <Link
          href={`/contacts/${contact.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">{contact.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {contact.designation ?? "No designation"}
              </p>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{contact.company.name}</p>
          <p className="mt-1 truncate text-sm text-muted-foreground">
            {contact.email ?? contact.phone ?? "No contact info"}
          </p>
        </Link>
      )}
    />
  );
}
