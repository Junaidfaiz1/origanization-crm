"use server";

import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors/app-error";
import { setSessionCookie, clearSessionCookie } from "@/lib/auth/session";
import { loginUser, registerOrganization } from "@/modules/auth/service";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
} from "@/modules/auth/validation";
import { logger } from "@/lib/logging/logger";
import { homePathForRole } from "@/lib/auth/home";

export type AuthFormState = {
  message?: string;
  errors?: Record<string, string[]>;
};

export async function registerAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    organizationName: formData.get("organizationName"),
  });

  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await registerOrganization(parsed.data);
    await setSessionCookie(result.token);
  } catch (error) {
    if (error instanceof AppError) {
      return { message: error.message };
    }
    logger.error("Registration failed", { operation: "auth.register", error });
    return { message: "Unable to create your workspace. Try again." };
  }

  redirect("/dashboard");
}

export async function loginAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      message: "Please fix the highlighted fields.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await loginUser(parsed.data);
    await setSessionCookie(result.token);
    redirect(homePathForRole(result.roleKey));
  } catch (error) {
    if (error instanceof AppError) {
      return { message: error.message };
    }
    // Next.js redirect throws; rethrow
    if (
      typeof error === "object" &&
      error !== null &&
      "digest" in error &&
      typeof error.digest === "string" &&
      error.digest.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    logger.error("Login failed", { operation: "auth.login", error });
    return { message: "Unable to sign in. Try again." };
  }
}

export async function logoutAction() {
  await clearSessionCookie();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return {
      message: "Please enter a valid email.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  return {
    message:
      "If an account exists for that email, you will receive reset instructions shortly.",
  };
}
