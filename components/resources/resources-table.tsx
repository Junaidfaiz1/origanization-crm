import Link from "next/link";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedResource } from "@/modules/resources/service";

export function ResourcesTable({ resources }: { resources: SerializedResource[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Availability</th>
              <th className="px-4 py-3 font-medium">Rate</th>
              <th className="px-4 py-3 font-medium">Experience</th>
              <th className="px-4 py-3 font-medium">Skills</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/resources/${resource.id}`}
                    className="font-medium hover:underline"
                  >
                    {resource.user.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{resource.user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={resource.type} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={resource.availabilityStatus} />
                </td>
                <td className="px-4 py-3">
                  {resource.hourlyRate ? (
                    <>
                      <MoneyDisplay amount={resource.hourlyRate} />/hr
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {resource.experienceYears ?? "—"}
                  {resource.rating ? (
                    <span className="ml-2 text-xs">★ {resource.rating}</span>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {resource.skills.length > 0
                    ? resource.skills.map((skill) => skill.name).join(", ")
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {resources.map((resource) => (
          <Link
            key={resource.id}
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
        ))}
      </div>
    </>
  );
}
