"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePortalUser } from "@/lib/auth/page";
import {
  acceptPortalProposal,
  rejectPortalProposal,
} from "@/modules/client-portal/service";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function acceptPortalProposalAction(formData: FormData) {
  const actor = await requirePortalUser();
  const id = formValue(formData, "id");
  await acceptPortalProposal(actor, id);
  revalidatePath("/portal");
  revalidatePath("/portal/proposals");
  revalidatePath(`/portal/proposals/${id}`);
  revalidatePath("/portal/projects");
  redirect(`/portal/proposals/${id}`);
}

export async function rejectPortalProposalAction(formData: FormData) {
  const actor = await requirePortalUser();
  const id = formValue(formData, "id");
  await rejectPortalProposal(actor, id);
  revalidatePath("/portal");
  revalidatePath("/portal/proposals");
  revalidatePath(`/portal/proposals/${id}`);
  redirect(`/portal/proposals/${id}`);
}
