"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError, ValidationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createTimeEntrySchema,
  startTimerSchema,
  updateTimeEntrySchema,
} from "@/modules/time-tracking/validation";
import {
  createTimeEntry,
  deleteTimeEntry,
  startTimer,
  stopTimeEntry,
  updateTimeEntry,
} from "@/modules/time-tracking/service";
import { logger } from "@/lib/logging/logger";

export type TimeEntryFormState = {
  message?: string;
  errors?: Record<string, string[]>;
};

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof error.digest === "string" &&
    error.digest.startsWith("NEXT_REDIRECT")
  );
}

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function timeEntryFields(formData: FormData) {
  return {
    projectId: formValue(formData, "projectId"),
    taskId: formValue(formData, "taskId"),
    userId: formValue(formData, "userId"),
    startedAt: formValue(formData, "startedAt"),
    endedAt: formValue(formData, "endedAt"),
    hourlyRate: formValue(formData, "hourlyRate"),
    billable: formValue(formData, "billable") === "on" || formValue(formData, "billable") === "true",
    notes: formValue(formData, "notes"),
  };
}

function revalidateTimeEntryPaths(projectId: string, entryId?: string) {
  revalidatePath("/time-tracking");
  revalidatePath(`/projects/${projectId}`);
  if (entryId) {
    revalidatePath(`/time-tracking/${entryId}`);
  }
}

export async function createTimeEntryAction(
  _prev: TimeEntryFormState,
  formData: FormData,
): Promise<TimeEntryFormState> {
  let actor;
  try {
    actor = await requirePagePermission("TIME_ENTRY_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createTimeEntrySchema.safeParse(timeEntryFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const entry = await createTimeEntry(actor, parsed.data);
    revalidateTimeEntryPaths(entry.projectId, entry.id);
    redirect(`/time-tracking/${entry.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Create time entry failed", { operation: "timeEntry.create", error });
    return { message: "Unable to log this time entry. Try again." };
  }
}

export async function updateTimeEntryAction(
  _prev: TimeEntryFormState,
  formData: FormData,
): Promise<TimeEntryFormState> {
  let actor;
  try {
    actor = await requirePagePermission("TIME_ENTRY_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) return { message: "Time entry id is required." };

  const parsed = updateTimeEntrySchema.safeParse(timeEntryFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const entry = await updateTimeEntry(actor, id, parsed.data);
    revalidateTimeEntryPaths(entry.projectId, entry.id);
    redirect(`/time-tracking/${entry.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Update time entry failed", { operation: "timeEntry.update", error });
    return { message: "Unable to update this time entry. Try again." };
  }
}

export async function startTimerAction(formData: FormData) {
  const actor = await requirePagePermission("TIME_ENTRY_CREATE");
  const parsed = startTimerSchema.safeParse({
    projectId: formValue(formData, "projectId"),
    taskId: formValue(formData, "taskId"),
    billable: formValue(formData, "billable") !== "false",
    notes: formValue(formData, "notes"),
  });
  if (!parsed.success) {
    throw new ValidationError("Invalid timer input");
  }
  const entry = await startTimer(actor, parsed.data);
  revalidateTimeEntryPaths(entry.projectId, entry.id);
  redirect("/time-tracking");
}

export async function stopTimerAction(formData: FormData) {
  const actor = await requirePagePermission("TIME_ENTRY_UPDATE");
  const id = formValue(formData, "id");
  const entry = await stopTimeEntry(actor, id);
  revalidateTimeEntryPaths(entry.projectId, entry.id);
  redirect(`/time-tracking/${entry.id}`);
}

export async function deleteTimeEntryAction(formData: FormData) {
  const actor = await requirePagePermission("TIME_ENTRY_UPDATE");
  const id = formValue(formData, "id");
  const entry = await deleteTimeEntry(actor, id);
  revalidateTimeEntryPaths(entry.projectId);
  redirect("/time-tracking");
}
