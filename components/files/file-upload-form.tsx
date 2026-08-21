"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { uploadFileAction, type FileFormState } from "@/modules/files/actions";
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from "@/modules/files/rules";

const initialState: FileFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type ProjectOption = {
  id: string;
  name: string;
  client: { company: { name: string } };
};

export function FileUploadForm({
  projects,
  defaultProjectId,
}: {
  projects: ProjectOption[];
  defaultProjectId?: string;
}) {
  const [state, formAction, pending] = useActionState(uploadFileAction, initialState);

  return (
    <form action={formAction} className="space-y-4" encType="multipart/form-data">
      <input type="hidden" name="entityType" value="Project" />
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <FormField
        label="Project"
        htmlFor="entityId"
        error={state.errors?.entityId?.[0]}
      >
        <select
          id="entityId"
          name="entityId"
          required
          defaultValue={defaultProjectId ?? ""}
          className={selectClassName}
        >
          <option value="" disabled>
            Select project
          </option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name} · {project.client.company.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="File" htmlFor="file" error={state.errors?.file?.[0]}>
        <Input
          id="file"
          name="file"
          type="file"
          required
          accept={ALLOWED_MIME_TYPES.join(",")}
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Max {(MAX_FILE_SIZE_BYTES / (1024 * 1024)).toFixed(0)} MB. PDF, images, Office,
          CSV, ZIP.
        </p>
      </FormField>
      <Button type="submit" disabled={pending}>
        {pending ? "Uploading…" : "Upload file"}
      </Button>
    </form>
  );
}
