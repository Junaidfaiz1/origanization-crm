"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import {
  assignTeamMemberSchema,
  updateTeamMemberSchema,
} from "@/modules/team/validation";
import {
  assignTeamMember,
  removeTeamMember,
  updateTeamMember,
} from "@/modules/team/service";
import { logger } from "@/lib/logging/logger";

export type TeamFormState = {
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

function revalidateTeamPaths(projectId: string, memberId?: string) {
  revalidatePath("/team");
  revalidatePath(`/projects/${projectId}`);
  if (memberId) {
    revalidatePath(`/team/${memberId}`);
  }
}

export async function assignTeamMemberAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  let actor;
  try {
    actor = await requirePagePermission("PROJECT_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = assignTeamMemberSchema.safeParse({
    projectId: formValue(formData, "projectId"),
    resourceId: formValue(formData, "resourceId"),
    role: formValue(formData, "role"),
  });
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const member = await assignTeamMember(actor, parsed.data);
    revalidateTeamPaths(member.projectId, member.id);
    redirect(`/team/${member.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Assign team member failed", { operation: "team.assign", error });
    return { message: "Unable to assign this team member. Try again." };
  }
}

export async function updateTeamMemberAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  let actor;
  try {
    actor = await requirePagePermission("PROJECT_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const id = formValue(formData, "id");
  if (!id) {
    return { message: "Assignment id is required." };
  }

  const parsed = updateTeamMemberSchema.safeParse({
    role: formValue(formData, "role"),
  });
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    const member = await updateTeamMember(actor, id, parsed.data);
    revalidateTeamPaths(member.projectId, member.id);
    redirect(`/team/${member.id}`);
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Update team member failed", { operation: "team.update", error });
    return { message: "Unable to update this assignment. Try again." };
  }
}

export async function removeTeamMemberAction(formData: FormData) {
  const actor = await requirePagePermission("PROJECT_UPDATE");
  const id = formValue(formData, "id");
  const member = await removeTeamMember(actor, id);
  revalidateTeamPaths(member.projectId);
  redirect("/team");
}
