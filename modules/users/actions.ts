"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AppError, AuthorizationError } from "@/lib/errors/app-error";
import { requirePagePermission } from "@/lib/auth/page";
import { logger } from "@/lib/logging/logger";
import { withFlashToast } from "@/lib/ui/flash-toast";
import {
  inviteUserSchema,
  suspendMemberSchema,
  updateMemberRoleSchema,
} from "@/modules/users/validation";
import {
  inviteUser,
  resendInvite,
  suspendMember,
  updateMemberRole,
} from "@/modules/users/service";

export type UsersFormState = {
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

export async function inviteUserAction(
  _prev: UsersFormState,
  formData: FormData,
): Promise<UsersFormState> {
  let actor;
  try {
    actor = await requirePagePermission("USER_INVITE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = inviteUserSchema.safeParse({
    name: formValue(formData, "name"),
    email: formValue(formData, "email"),
    roleKey: formValue(formData, "roleKey"),
  });
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await inviteUser(
      {
        userId: actor.userId,
        organizationId: actor.organizationId,
        roleKey: actor.roleKey,
      },
      parsed.data,
    );
    revalidatePath("/settings");
    redirect(withFlashToast("/settings", "invited"));
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Invite failed", { operation: "users.invite", error });
    return { message: "Unable to send invite. Try again." };
  }
}

export async function updateMemberRoleAction(
  _prev: UsersFormState,
  formData: FormData,
): Promise<UsersFormState> {
  let actor;
  try {
    actor = await requirePagePermission("USER_UPDATE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = updateMemberRoleSchema.safeParse({
    membershipId: formValue(formData, "membershipId"),
    roleKey: formValue(formData, "roleKey"),
  });
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await updateMemberRole(
      {
        userId: actor.userId,
        organizationId: actor.organizationId,
        roleKey: actor.roleKey,
      },
      parsed.data,
    );
    revalidatePath("/settings");
    redirect(withFlashToast("/settings", "updated"));
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Role update failed", {
      operation: "users.updateRole",
      error,
    });
    return { message: "Unable to update role. Try again." };
  }
}

export async function suspendMemberAction(
  _prev: UsersFormState,
  formData: FormData,
): Promise<UsersFormState> {
  let actor;
  try {
    actor = await requirePagePermission("USER_DELETE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const parsed = suspendMemberSchema.safeParse({
    membershipId: formValue(formData, "membershipId"),
  });
  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    };
  }

  try {
    await suspendMember(
      {
        userId: actor.userId,
        organizationId: actor.organizationId,
        roleKey: actor.roleKey,
      },
      parsed.data,
    );
    revalidatePath("/settings");
    redirect(withFlashToast("/settings", "updated"));
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Suspend failed", { operation: "users.suspend", error });
    return { message: "Unable to suspend member. Try again." };
  }
}

export async function resendInviteAction(
  _prev: UsersFormState,
  formData: FormData,
): Promise<UsersFormState> {
  let actor;
  try {
    actor = await requirePagePermission("USER_INVITE");
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return { message: error.message };
    }
    throw error;
  }

  const membershipId = formValue(formData, "membershipId");
  if (!membershipId) {
    return { message: "Member is required." };
  }

  try {
    await resendInvite(
      {
        userId: actor.userId,
        organizationId: actor.organizationId,
        roleKey: actor.roleKey,
      },
      membershipId,
    );
    revalidatePath("/settings");
    redirect(withFlashToast("/settings", "sent"));
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Resend invite failed", {
      operation: "users.resendInvite",
      error,
    });
    return { message: "Unable to resend invite. Try again." };
  }
}
