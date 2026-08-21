"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import { createCompanySchema, updateCompanySchema } from "@/modules/companies/validation";
import { archiveCompany, createCompany, updateCompany } from "@/modules/companies/service";
import { logger } from "@/lib/logging/logger";

export type CompanyFormState = {
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

function companyFields(formData: FormData) {
  return {
    name: formValue(formData, "name"),
    website: formValue(formData, "website"),
    industry: formValue(formData, "industry"),
    address: formValue(formData, "address"),
    city: formValue(formData, "city"),
    country: formValue(formData, "country"),
  };
}

export async function createCompanyAction(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
  let actor;
  try {
    actor = await requirePagePermission("COMPANY_CREATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = createCompanySchema.safeParse(companyFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const company = await createCompany(actor, parsed.data);
    revalidatePath("/companies");
    redirect(`/companies/${company.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Create company failed", { operation: "company.create", error });
    return { message: "Unable to create this company. Try again." };
  }
}

export async function updateCompanyAction(
  _prev: CompanyFormState,
  formData: FormData,
): Promise<CompanyFormState> {
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
    return { message: "Company id is required." };
  }

  const parsed = updateCompanySchema.safeParse(companyFields(formData));
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateCompany(actor, id, parsed.data);
    revalidatePath("/companies");
    revalidatePath(`/companies/${id}`);
    redirect(`/companies/${id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Update company failed", { operation: "company.update", error });
    return { message: "Unable to update this company. Try again." };
  }
}

export async function archiveCompanyAction(formData: FormData) {
  const actor = await requirePagePermission("COMPANY_UPDATE");
  const id = formValue(formData, "id");
  await archiveCompany(actor, id);
  revalidatePath("/companies");
  redirect("/companies");
}
