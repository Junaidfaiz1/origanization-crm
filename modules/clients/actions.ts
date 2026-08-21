"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import { createClientSchema, updateClientSchema } from "@/modules/clients/validation";
import { archiveClient, createClient, updateClient } from "@/modules/clients/service";
import { logger } from "@/lib/logging/logger";

export type ClientFormState = {
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

function clientFields(formData: FormData) {
  return {
    companyId: formValue(formData, "companyId"),
    primaryContactId: formValue(formData, "primaryContactId"),
    status: formValue(formData, "status"),
    notes: formValue(formData, "notes"),
  };
}

export async function createClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  let actor;
  try {
    actor = await requirePagePermission("CLIENT_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createClientSchema.safeParse(clientFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const client = await createClient(actor, parsed.data);
    revalidatePath("/clients");
    revalidatePath(`/companies/${client.companyId}`);
    redirect(`/clients/${client.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Create client failed", { operation: "client.create", error });
    return { message: "Unable to create this client. Try again." };
  }
}

export async function updateClientAction(
  _prev: ClientFormState,
  formData: FormData,
): Promise<ClientFormState> {
  let actor;
  try {
    actor = await requirePagePermission("CLIENT_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) {
    return { message: "Client id is required." };
  }

  const parsed = updateClientSchema.safeParse(clientFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const client = await updateClient(actor, id, parsed.data);
    revalidatePath("/clients");
    revalidatePath(`/clients/${id}`);
    revalidatePath(`/companies/${client.companyId}`);
    redirect(`/clients/${id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Update client failed", { operation: "client.update", error });
    return { message: "Unable to update this client. Try again." };
  }
}

export async function archiveClientAction(formData: FormData) {
  const actor = await requirePagePermission("CLIENT_DELETE");
  const id = formValue(formData, "id");
  const client = await archiveClient(actor, id);
  revalidatePath("/clients");
  revalidatePath(`/companies/${client.companyId}`);
  redirect("/clients");
}
