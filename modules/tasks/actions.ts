"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError, ValidationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "@/modules/tasks/validation";
import {
  createTask,
  deleteTask,
  updateTask,
  updateTaskStatus,
} from "@/modules/tasks/service";
import { logger } from "@/lib/logging/logger";

export type TaskFormState = {
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

function taskFields(formData: FormData) {
  return {
    projectId: formValue(formData, "projectId"),
    milestoneId: formValue(formData, "milestoneId"),
    assignedToId: formValue(formData, "assignedToId"),
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    priority: formValue(formData, "priority"),
    status: formValue(formData, "status"),
    dueDate: formValue(formData, "dueDate"),
    estimatedHours: formValue(formData, "estimatedHours"),
    actualHours: formValue(formData, "actualHours"),
  };
}

function revalidateTaskPaths(projectId: string, taskId?: string) {
  revalidatePath("/tasks");
  revalidatePath(`/projects/${projectId}`);
  if (taskId) {
    revalidatePath(`/tasks/${taskId}`);
  }
}

export async function createTaskAction(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  let actor;
  try {
    actor = await requirePagePermission("TASK_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createTaskSchema.safeParse(taskFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const task = await createTask(actor, parsed.data);
    revalidateTaskPaths(task.projectId, task.id);
    redirect(`/tasks/${task.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Create task failed", { operation: "task.create", error });
    return { message: "Unable to create this task. Try again." };
  }
}

export async function updateTaskAction(
  _prev: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  let actor;
  try {
    actor = await requirePagePermission("TASK_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) return { message: "Task id is required." };

  const parsed = updateTaskSchema.safeParse(taskFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const task = await updateTask(actor, id, parsed.data);
    revalidateTaskPaths(task.projectId, task.id);
    redirect(`/tasks/${task.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Update task failed", { operation: "task.update", error });
    return { message: "Unable to update this task. Try again." };
  }
}

export async function updateTaskStatusKanbanAction(formData: FormData) {
  const actor = await requirePagePermission("TASK_UPDATE");
  const id = formValue(formData, "id");
  const parsed = updateTaskStatusSchema.safeParse({ status: formValue(formData, "status") });
  if (!parsed.success) {
    throw new ValidationError("Invalid status");
  }
  const task = await updateTaskStatus(actor, id, parsed.data);
  revalidateTaskPaths(task.projectId, task.id);
}

export async function updateTaskStatusAction(formData: FormData) {
  const actor = await requirePagePermission("TASK_UPDATE");
  const id = formValue(formData, "id");
  const parsed = updateTaskStatusSchema.safeParse({ status: formValue(formData, "status") });
  if (!parsed.success) {
    throw new ValidationError("Invalid status");
  }
  const task = await updateTaskStatus(actor, id, parsed.data);
  revalidateTaskPaths(task.projectId, task.id);
  redirect(`/tasks/${task.id}`);
}

export async function deleteTaskAction(formData: FormData) {
  const actor = await requirePagePermission("TASK_DELETE");
  const id = formValue(formData, "id");
  const task = await deleteTask(actor, id);
  revalidateTaskPaths(task.projectId);
  redirect("/tasks");
}
