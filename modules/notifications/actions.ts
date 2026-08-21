"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { getAuthenticatedUser } from "@/modules/auth/service";
import { AuthorizationError } from "@/lib/errors/app-error";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/notifications/service";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function requireNotificationActor() {
  const session = await getSession();
  if (!session) {
    throw new AuthorizationError("Not authenticated");
  }
  const user = await getAuthenticatedUser(session.sub, session.org);
  if (!user) {
    throw new AuthorizationError("Not authenticated");
  }
  return {
    userId: user.id,
    organizationId: user.organization.id,
    permissions: user.permissions,
    roleKey: user.roleKey,
  };
}

function revalidateNotificationPaths() {
  revalidatePath("/notifications");
  revalidatePath("/portal/notifications");
  revalidatePath("/freelancer/notifications");
  revalidatePath("/dashboard");
}

export async function markNotificationReadAction(formData: FormData) {
  const actor = await requireNotificationActor();
  const id = formValue(formData, "id");
  await markNotificationRead(actor, id);
  revalidateNotificationPaths();
}

export async function markAllNotificationsReadAction() {
  const actor = await requireNotificationActor();
  await markAllNotificationsRead(actor);
  revalidateNotificationPaths();
}
