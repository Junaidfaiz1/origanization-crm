"use client";

import { useRouter, useSearchParams } from "next/navigation";

type ProjectOption = {
  id: string;
  name: string;
  client: { company: { name: string } };
};

export function TeamProjectFilter({ projects }: { projects: ProjectOption[] }) {
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
      <option value="">All projects</option>
      {projects.map((project) => (
        <option key={project.id} value={project.id}>
          {project.name} · {project.client.company.name}
        </option>
      ))}
    </select>
  );
}

export function TeamTypeFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("type") ?? "";

  return (
    <select
      aria-label="Filter by resource type"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-48 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("type", event.target.value);
        } else {
          next.delete("type");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All types</option>
      <option value="EMPLOYEE">Employee</option>
      <option value="FREELANCER">Freelancer</option>
    </select>
  );
}
