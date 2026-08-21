"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError, ValidationError } from "@/lib/errors/app-error";
import { hasPermission } from "@/config/permissions";
import { requireFreelancerUser } from "@/lib/auth/page";
import {
  negotiateBidSchema,
  submitBidSchema,
} from "@/modules/bidding/validation";
import {
  negotiateBid,
  submitBid,
  withdrawBid,
} from "@/modules/bidding/service";
import { updateTaskStatusSchema } from "@/modules/tasks/validation";
import { updateTaskStatus } from "@/modules/tasks/service";
import { startTimerSchema } from "@/modules/time-tracking/validation";
import { startTimer, stopTimeEntry } from "@/modules/time-tracking/service";
import { logger } from "@/lib/logging/logger";

export type FreelancerFormState = {
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

function revalidateFreelancer(paths: string[] = []) {
  revalidatePath("/freelancer");
  revalidatePath("/freelancer/requests");
  revalidatePath("/freelancer/bids");
  revalidatePath("/freelancer/tasks");
  revalidatePath("/freelancer/time");
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function submitFreelancerBidAction(
  _prev: FreelancerFormState,
  formData: FormData,
): Promise<FreelancerFormState> {
  const actor = await requireFreelancerUser();
  if (!hasPermission(actor.permissions, "BID_SUBMIT")) {
    return { message: "You do not have permission to submit bids." };
  }

  const parsed = submitBidSchema.safeParse({
    bidRequestId: formValue(formData, "bidRequestId"),
    amount: formValue(formData, "amount"),
    estimatedDays: formValue(formData, "estimatedDays"),
    proposal: formValue(formData, "proposal"),
  });

  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const bid = await submitBid(actor, parsed.data);
    revalidateFreelancer([
      `/freelancer/requests/${bid.bidRequestId}`,
      `/freelancer/bids/${bid.id}`,
    ]);
    redirect(`/freelancer/bids/${bid.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Freelancer submit bid failed", {
      operation: "freelancerPortal.submitBid",
      error,
    });
    return { message: "Unable to submit this bid. Try again." };
  }
}

export async function withdrawFreelancerBidAction(formData: FormData) {
  const actor = await requireFreelancerUser();
  if (!hasPermission(actor.permissions, "BID_UPDATE")) {
    throw new AuthorizationError("Missing BID_UPDATE");
  }
  const id = formValue(formData, "id");
  const bid = await withdrawBid(actor, id);
  revalidateFreelancer([
    `/freelancer/bids/${bid.id}`,
    `/freelancer/requests/${bid.bidRequestId}`,
  ]);
  redirect(`/freelancer/bids/${bid.id}`);
}

export async function negotiateFreelancerBidAction(
  _prev: FreelancerFormState,
  formData: FormData,
): Promise<FreelancerFormState> {
  const actor = await requireFreelancerUser();
  if (!hasPermission(actor.permissions, "BID_UPDATE")) {
    return { message: "You do not have permission to negotiate bids." };
  }

  const id = formValue(formData, "id");
  if (!id) return { message: "Bid id is required." };

  const parsed = negotiateBidSchema.safeParse({
    amount: formValue(formData, "amount"),
    estimatedDays: formValue(formData, "estimatedDays"),
    message: formValue(formData, "message"),
  });

  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const bid = await negotiateBid(actor, id, parsed.data);
    revalidateFreelancer([`/freelancer/bids/${bid.id}`]);
    redirect(`/freelancer/bids/${bid.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Freelancer negotiate bid failed", {
      operation: "freelancerPortal.negotiateBid",
      error,
    });
    return { message: "Unable to send this counter-offer. Try again." };
  }
}

export async function updateFreelancerTaskStatusAction(formData: FormData) {
  const actor = await requireFreelancerUser();
  if (!hasPermission(actor.permissions, "TASK_UPDATE")) {
    throw new AuthorizationError("Missing TASK_UPDATE");
  }
  const id = formValue(formData, "id");
  const parsed = updateTaskStatusSchema.safeParse({
    status: formValue(formData, "status"),
  });
  if (!parsed.success) {
    throw new ValidationError("Invalid status");
  }
  const task = await updateTaskStatus(actor, id, parsed.data);
  revalidateFreelancer([`/freelancer/tasks/${task.id}`]);
  redirect(`/freelancer/tasks/${task.id}`);
}

export async function startFreelancerTimerAction(formData: FormData) {
  const actor = await requireFreelancerUser();
  if (!hasPermission(actor.permissions, "TIME_ENTRY_CREATE")) {
    throw new AuthorizationError("Missing TIME_ENTRY_CREATE");
  }
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
  revalidateFreelancer([`/freelancer/time/${entry.id}`]);
  redirect("/freelancer/time");
}

export async function stopFreelancerTimerAction(formData: FormData) {
  const actor = await requireFreelancerUser();
  if (!hasPermission(actor.permissions, "TIME_ENTRY_UPDATE")) {
    throw new AuthorizationError("Missing TIME_ENTRY_UPDATE");
  }
  const id = formValue(formData, "id");
  const entry = await stopTimeEntry(actor, id);
  revalidateFreelancer([`/freelancer/time/${entry.id}`]);
  redirect(`/freelancer/time/${entry.id}`);
}
