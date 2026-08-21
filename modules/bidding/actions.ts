"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createBidRequestSchema,
  negotiateBidSchema,
  submitBidSchema,
  updateBidRequestSchema,
  updateBidSchema,
} from "@/modules/bidding/validation";
import {
  acceptBid,
  cancelBidRequest,
  closeBidRequest,
  createBidRequest,
  negotiateBid,
  openBidRequest,
  pauseBidRequest,
  rejectBid,
  shortlistBid,
  submitBid,
  updateBidRequest,
  updateMyBid,
  withdrawBid,
} from "@/modules/bidding/service";
import { logger } from "@/lib/logging/logger";

export type BiddingFormState = {
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

function revalidateBidding(paths: string[] = []) {
  revalidatePath("/bidding");
  revalidatePath("/bidding/my-bids");
  for (const path of paths) {
    revalidatePath(path);
  }
}

export async function createBidRequestAction(
  _prev: BiddingFormState,
  formData: FormData,
): Promise<BiddingFormState> {
  let actor;
  try {
    actor = await requirePagePermission("BID_REQUEST_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createBidRequestSchema.safeParse({
    projectId: formValue(formData, "projectId"),
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    budgetMin: formValue(formData, "budgetMin"),
    budgetMax: formValue(formData, "budgetMax"),
    currency: formValue(formData, "currency") || "USD",
    deadline: formValue(formData, "deadline"),
    biddingType: formValue(formData, "biddingType") || "EXTERNAL",
    startsAt: formValue(formData, "startsAt"),
    endsAt: formValue(formData, "endsAt"),
  });

  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const request = await createBidRequest(actor, parsed.data);
    revalidateBidding([`/projects/${request.projectId}`, `/bidding/requests/${request.id}`]);
    redirect(`/bidding/requests/${request.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Create bid request failed", { operation: "bidRequest.create", error });
    return { message: "Unable to create this bid request. Try again." };
  }
}

export async function updateBidRequestAction(
  _prev: BiddingFormState,
  formData: FormData,
): Promise<BiddingFormState> {
  let actor;
  try {
    actor = await requirePagePermission("BID_REQUEST_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) return { message: "Bid request id is required." };

  const parsed = updateBidRequestSchema.safeParse({
    projectId: formValue(formData, "projectId"),
    title: formValue(formData, "title"),
    description: formValue(formData, "description"),
    budgetMin: formValue(formData, "budgetMin"),
    budgetMax: formValue(formData, "budgetMax"),
    currency: formValue(formData, "currency") || "USD",
    deadline: formValue(formData, "deadline"),
    biddingType: formValue(formData, "biddingType") || "EXTERNAL",
    startsAt: formValue(formData, "startsAt"),
    endsAt: formValue(formData, "endsAt"),
  });

  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const request = await updateBidRequest(actor, id, parsed.data);
    revalidateBidding([`/bidding/requests/${id}`, `/projects/${request.projectId}`]);
    redirect(`/bidding/requests/${id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Update bid request failed", { operation: "bidRequest.update", error });
    return { message: "Unable to update this bid request. Try again." };
  }
}

async function runRequestStatusAction(
  permission: "BID_REQUEST_OPEN" | "BID_REQUEST_CLOSE" | "BID_REQUEST_UPDATE",
  formData: FormData,
  fn: (
    actor: Awaited<ReturnType<typeof requirePagePermission>>,
    id: string,
  ) => Promise<{ id: string; projectId: string }>,
) {
  const actor = await requirePagePermission(permission);
  const id = formValue(formData, "id");
  const request = await fn(actor, id);
  revalidateBidding([`/bidding/requests/${request.id}`, `/projects/${request.projectId}`]);
  redirect(`/bidding/requests/${request.id}`);
}

export async function openBidRequestAction(formData: FormData) {
  return runRequestStatusAction("BID_REQUEST_OPEN", formData, openBidRequest);
}

export async function pauseBidRequestAction(formData: FormData) {
  return runRequestStatusAction("BID_REQUEST_UPDATE", formData, pauseBidRequest);
}

export async function closeBidRequestAction(formData: FormData) {
  return runRequestStatusAction("BID_REQUEST_CLOSE", formData, closeBidRequest);
}

export async function cancelBidRequestAction(formData: FormData) {
  return runRequestStatusAction("BID_REQUEST_UPDATE", formData, cancelBidRequest);
}

export async function submitBidAction(
  _prev: BiddingFormState,
  formData: FormData,
): Promise<BiddingFormState> {
  let actor;
  try {
    actor = await requirePagePermission("BID_SUBMIT");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
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
    revalidateBidding([
      `/bidding/requests/${bid.bidRequestId}`,
      `/bidding/my-bids/${bid.id}`,
    ]);
    redirect(`/bidding/my-bids/${bid.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Submit bid failed", { operation: "bid.submit", error });
    return { message: "Unable to submit this bid. Try again." };
  }
}

export async function updateMyBidAction(
  _prev: BiddingFormState,
  formData: FormData,
): Promise<BiddingFormState> {
  let actor;
  try {
    actor = await requirePagePermission("BID_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) return { message: "Bid id is required." };

  const parsed = updateBidSchema.safeParse({
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
    const bid = await updateMyBid(actor, id, parsed.data);
    revalidateBidding([`/bidding/my-bids/${bid.id}`, `/bidding/requests/${bid.bidRequestId}`]);
    redirect(`/bidding/my-bids/${bid.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Update bid failed", { operation: "bid.update", error });
    return { message: "Unable to update this bid. Try again." };
  }
}

export async function withdrawBidAction(formData: FormData) {
  const actor = await requirePagePermission("BID_UPDATE");
  const id = formValue(formData, "id");
  const bid = await withdrawBid(actor, id);
  revalidateBidding([`/bidding/my-bids/${bid.id}`, `/bidding/requests/${bid.bidRequestId}`]);
  redirect(`/bidding/my-bids/${bid.id}`);
}

export async function shortlistBidAction(formData: FormData) {
  const actor = await requirePagePermission("BID_SHORTLIST");
  const id = formValue(formData, "id");
  const bid = await shortlistBid(actor, id);
  revalidateBidding([`/bidding/requests/${bid.bidRequestId}`]);
  redirect(`/bidding/requests/${bid.bidRequestId}`);
}

export async function rejectBidAction(formData: FormData) {
  const actor = await requirePagePermission("BID_REJECT");
  const id = formValue(formData, "id");
  const bid = await rejectBid(actor, id);
  revalidateBidding([`/bidding/requests/${bid.bidRequestId}`]);
  redirect(`/bidding/requests/${bid.bidRequestId}`);
}

export async function acceptBidAction(formData: FormData) {
  const actor = await requirePagePermission("BID_ACCEPT");
  const id = formValue(formData, "id");
  const bid = await acceptBid(actor, id);
  revalidateBidding([
    `/bidding/requests/${bid.bidRequestId}`,
    `/projects/${bid.bidRequest.projectId}`,
  ]);
  redirect(`/bidding/requests/${bid.bidRequestId}`);
}

export async function negotiateBidAction(
  _prev: BiddingFormState,
  formData: FormData,
): Promise<BiddingFormState> {
  const { requireDashboardUser } = await import("@/lib/auth/page");
  const { hasPermission } = await import("@/config/permissions");

  const ctx = await requireDashboardUser();
  const canNegotiate =
    hasPermission(ctx.permissions, "BID_UPDATE") ||
    hasPermission(ctx.permissions, "BID_SHORTLIST") ||
    hasPermission(ctx.permissions, "BID_ACCEPT");

  if (!canNegotiate) {
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
    const bid = await negotiateBid(ctx, id, parsed.data);
    const isManager =
      hasPermission(ctx.permissions, "BID_ACCEPT") ||
      hasPermission(ctx.permissions, "BID_SHORTLIST");
    revalidateBidding([`/bidding/requests/${bid.bidRequestId}`, `/bidding/my-bids/${bid.id}`]);
    redirect(
      isManager
        ? `/bidding/requests/${bid.bidRequestId}`
        : `/bidding/my-bids/${bid.id}`,
    );
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Negotiate bid failed", { operation: "bid.negotiate", error });
    return { message: "Unable to add negotiation. Try again." };
  }
}
