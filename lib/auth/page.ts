import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getAuthenticatedUser } from "@/modules/auth/service";
import { AuthorizationError } from "@/lib/errors/app-error";
import { hasPermission, type PermissionKey } from "@/config/permissions";
import { homePathForRole } from "@/lib/auth/home";

async function requireAuthenticatedUser() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await getAuthenticatedUser(session.sub, session.org);
  if (!user) {
    redirect("/login");
  }

  return {
    userId: user.id,
    organizationId: user.organization.id,
    permissions: user.permissions,
    roleKey: user.roleKey,
    user,
  };
}

export async function requireDashboardUser() {
  const ctx = await requireAuthenticatedUser();

  if (ctx.roleKey === "CLIENT") {
    redirect("/portal");
  }
  if (ctx.roleKey === "FREELANCER") {
    redirect("/freelancer");
  }

  return ctx;
}

export async function requirePortalUser() {
  const ctx = await requireAuthenticatedUser();

  if (ctx.roleKey !== "CLIENT") {
    redirect(homePathForRole(ctx.roleKey));
  }

  return ctx;
}

export async function requireFreelancerUser() {
  const ctx = await requireAuthenticatedUser();

  if (ctx.roleKey !== "FREELANCER") {
    redirect(homePathForRole(ctx.roleKey));
  }

  return ctx;
}

export async function requirePagePermission(permission: PermissionKey) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, permission)) {
    throw new AuthorizationError();
  }
  return ctx;
}
