"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createProposalSchema,
  proposalItemSchema,
  updateProposalSchema,
} from "@/modules/proposals/validation";
import {
  archiveProposal,
  acceptProposal,
  createProposal,
  rejectProposal,
  sendProposal,
  updateProposal,
} from "@/modules/proposals/service";
import { logger } from "@/lib/logging/logger";

export type ProposalFormState = {
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

function parseItems(raw: string) {
  if (!raw.trim()) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return null;
    }
    const items = [];
    for (const entry of parsed) {
      const result = proposalItemSchema.safeParse(entry);
      if (!result.success) {
        return null;
      }
      items.push(result.data);
    }
    return items;
  } catch {
    return null;
  }
}

function proposalPayload(formData: FormData) {
  const items = parseItems(formValue(formData, "itemsJson"));
  return {
    payload: {
      opportunityId: formValue(formData, "opportunityId"),
      title: formValue(formData, "title"),
      description: formValue(formData, "description"),
      discount: formValue(formData, "discount"),
      tax: formValue(formData, "tax"),
      currency: formValue(formData, "currency") || "USD",
      validUntil: formValue(formData, "validUntil"),
      items,
    },
    itemsError: items === null,
  };
}

export async function createProposalAction(
  _prev: ProposalFormState,
  formData: FormData,
): Promise<ProposalFormState> {
  let actor;
  try {
    actor = await requirePagePermission("PROPOSAL_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const { payload, itemsError } = proposalPayload(formData);
  if (itemsError || !payload.items?.length) {
    return {
      message: "Add at least one valid line item.",
      errors: { items: ["Each item needs a description, quantity, and unit price."] },
    };
  }

  const parsed = createProposalSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const proposal = await createProposal(actor, parsed.data);
    revalidatePath("/proposals");
    revalidatePath(`/opportunities/${proposal.opportunityId}`);
    redirect(`/proposals/${proposal.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Create proposal failed", { operation: "proposal.create", error });
    return { message: "Unable to create this proposal. Try again." };
  }
}

export async function updateProposalAction(
  _prev: ProposalFormState,
  formData: FormData,
): Promise<ProposalFormState> {
  let actor;
  try {
    actor = await requirePagePermission("PROPOSAL_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) {
    return { message: "Proposal id is required." };
  }

  const { payload, itemsError } = proposalPayload(formData);
  if (itemsError || !payload.items?.length) {
    return {
      message: "Add at least one valid line item.",
      errors: { items: ["Each item needs a description, quantity, and unit price."] },
    };
  }

  const parsed = updateProposalSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const proposal = await updateProposal(actor, id, parsed.data);
    revalidatePath("/proposals");
    revalidatePath(`/proposals/${id}`);
    revalidatePath(`/opportunities/${proposal.opportunityId}`);
    redirect(`/proposals/${id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Update proposal failed", { operation: "proposal.update", error });
    return { message: "Unable to update this proposal. Try again." };
  }
}

export async function sendProposalAction(formData: FormData) {
  const actor = await requirePagePermission("PROPOSAL_SEND");
  const id = formValue(formData, "id");
  const proposal = await sendProposal(actor, id);
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${id}`);
  revalidatePath(`/opportunities/${proposal.opportunityId}`);
  redirect(`/proposals/${id}`);
}

export async function acceptProposalAction(formData: FormData) {
  const actor = await requirePagePermission("PROPOSAL_ACCEPT");
  const id = formValue(formData, "id");
  const proposal = await acceptProposal(actor, id);
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${id}`);
  revalidatePath(`/opportunities/${proposal.opportunityId}`);
  redirect(`/proposals/${id}`);
}

export async function rejectProposalAction(formData: FormData) {
  const actor = await requirePagePermission("PROPOSAL_REJECT");
  const id = formValue(formData, "id");
  const proposal = await rejectProposal(actor, id);
  revalidatePath("/proposals");
  revalidatePath(`/proposals/${id}`);
  revalidatePath(`/opportunities/${proposal.opportunityId}`);
  redirect(`/proposals/${id}`);
}

export async function archiveProposalAction(formData: FormData) {
  const actor = await requirePagePermission("PROPOSAL_UPDATE");
  const id = formValue(formData, "id");
  const proposal = await archiveProposal(actor, id);
  revalidatePath("/proposals");
  revalidatePath(`/opportunities/${proposal.opportunityId}`);
  redirect("/proposals");
}
