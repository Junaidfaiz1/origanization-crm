"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  createContractSchema,
  updateContractSchema,
} from "@/modules/contracts/validation";
import {
  createContract,
  deleteContract,
  updateContract,
  updateContractStatus,
} from "@/modules/contracts/service";
import { logger } from "@/lib/logging/logger";

export type ContractFormState = {
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

function contractFields(formData: FormData) {
  return {
    projectId: formValue(formData, "projectId"),
    resourceId: formValue(formData, "resourceId"),
    bidId: formValue(formData, "bidId"),
    title: formValue(formData, "title"),
    content: formValue(formData, "content"),
    totalAmount: formValue(formData, "totalAmount"),
    currency: formValue(formData, "currency"),
    startDate: formValue(formData, "startDate"),
    endDate: formValue(formData, "endDate"),
  };
}

function revalidateContractPaths(projectId: string, contractId?: string) {
  revalidatePath("/contracts");
  revalidatePath(`/projects/${projectId}`);
  if (contractId) {
    revalidatePath(`/contracts/${contractId}`);
  }
}

export async function createContractAction(
  _prev: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  let actor;
  try {
    actor = await requirePagePermission("CONTRACT_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createContractSchema.safeParse(contractFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const contract = await createContract(actor, parsed.data);
    revalidateContractPaths(contract.projectId, contract.id);
    redirect(`/contracts/${contract.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Create contract failed", { operation: "contract.create", error });
    return { message: "Unable to create this contract. Try again." };
  }
}

export async function updateContractAction(
  _prev: ContractFormState,
  formData: FormData,
): Promise<ContractFormState> {
  let actor;
  try {
    actor = await requirePagePermission("CONTRACT_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) return { message: "Contract id is required." };

  const parsed = updateContractSchema.safeParse(contractFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const contract = await updateContract(actor, id, parsed.data);
    revalidateContractPaths(contract.projectId, contract.id);
    redirect(`/contracts/${contract.id}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    if (error instanceof AppError) return { message: error.message };
    logger.error("Update contract failed", { operation: "contract.update", error });
    return { message: "Unable to update this contract. Try again." };
  }
}

export async function updateContractStatusAction(formData: FormData) {
  const actor = await requirePagePermission("CONTRACT_UPDATE");
  const id = formValue(formData, "id");
  const status = formValue(formData, "status");
  const contract = await updateContractStatus(actor, id, {
    status: status as "DRAFT" | "SENT" | "SIGNED" | "ACTIVE" | "COMPLETED" | "CANCELLED",
  });
  revalidateContractPaths(contract.projectId, contract.id);
  redirect(`/contracts/${contract.id}`);
}

export async function deleteContractAction(formData: FormData) {
  const actor = await requirePagePermission("CONTRACT_CREATE");
  const id = formValue(formData, "id");
  const contract = await deleteContract(actor, id);
  revalidateContractPaths(contract.projectId);
  redirect("/contracts");
}
