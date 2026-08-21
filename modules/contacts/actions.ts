"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import { createContactSchema, updateContactSchema } from "@/modules/contacts/validation";
import { archiveContact, createContact, updateContact } from "@/modules/contacts/service";
import { logger } from "@/lib/logging/logger";

export type ContactFormState = {
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

function contactFields(formData: FormData) {
  return {
    companyId: formValue(formData, "companyId"),
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    phone: formValue(formData, "phone"),
    designation: formValue(formData, "designation"),
  };
}

export async function createContactAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  let actor;
  try {
    actor = await requirePagePermission("COMPANY_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createContactSchema.safeParse(contactFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const contact = await createContact(actor, parsed.data);
    revalidatePath("/contacts");
    revalidatePath(`/companies/${contact.companyId}`);
    redirect(`/contacts/${contact.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Create contact failed", { operation: "contact.create", error });
    return { message: "Unable to create this contact. Try again." };
  }
}

export async function updateContactAction(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  let actor;
  try {
    actor = await requirePagePermission("COMPANY_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) {
    return { message: "Contact id is required." };
  }

  const parsed = updateContactSchema.safeParse(contactFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const contact = await updateContact(actor, id, parsed.data);
    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);
    revalidatePath(`/companies/${contact.companyId}`);
    redirect(`/contacts/${id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Update contact failed", { operation: "contact.update", error });
    return { message: "Unable to update this contact. Try again." };
  }
}

export async function archiveContactAction(formData: FormData) {
  const actor = await requirePagePermission("COMPANY_UPDATE");
  const id = formValue(formData, "id");
  const contact = await archiveContact(actor, id);
  revalidatePath("/contacts");
  revalidatePath(`/companies/${contact.companyId}`);
  redirect("/contacts");
}
