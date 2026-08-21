import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import type { SerializedContact } from "@/modules/contacts/service";

export function ContactsTable({ contacts }: { contacts: SerializedContact[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {contacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/contacts/${contact.id}`}
                    className="font-medium hover:underline"
                  >
                    {contact.name}
                  </Link>
                  {contact.designation ? (
                    <p className="mt-1 text-xs text-muted-foreground">{contact.designation}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/companies/${contact.company.id}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {contact.company.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{contact.email ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">{contact.phone ?? "—"}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  <DateDisplay value={contact.createdAt} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {contacts.map((contact) => (
          <Link
            key={contact.id}
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
        ))}
      </div>
    </>
  );
}
