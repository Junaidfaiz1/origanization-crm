"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { PROJECT_ACTIVITY_ENTITY_TYPES } from "@/modules/activity/rules";

type ProjectOption = {
  id: string;
  name: string;
  client: { company: { name: string } };
};

export function ActivityProjectFilter({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("projectId") ?? "";

  return (
    <select
      aria-label="Filter by project"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-64 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("projectId", event.target.value);
        } else {
          next.delete("projectId");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All delivery activity</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name} · {project.client.company.name}
        </option>
      ))}
    </select>
  );
}

export function ActivityEntityFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("entityType") ?? "";

  return (
    <select
      aria-label="Filter by entity type"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-52 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("entityType", event.target.value);
        } else {
          next.delete("entityType");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All types</option>
      {PROJECT_ACTIVITY_ENTITY_TYPES.map((type) => (
        <option key={type} value={type}>
          {type.replaceAll(/([a-z])([A-Z])/g, "$1 $2")}
        </option>
      ))}
    </select>
  );
}
