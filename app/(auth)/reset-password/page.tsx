import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { AuthPanel } from "@/components/auth/auth-panel";
import { inspectAuthToken } from "@/modules/auth/service";
import { NotFoundError } from "@/lib/errors/app-error";
import Link from "next/link";

export const metadata = { title: "Set password" };

type Props = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token?.trim();

  if (!token) {
    return (
      <AuthPanel
        title="Invalid link"
        description="This password link is missing a token. Request a new one from the sign-in page."
      >
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary hover:underline"
        >
          Request reset link →
        </Link>
      </AuthPanel>
    );
  }

  let inspection: Awaited<ReturnType<typeof inspectAuthToken>> | null = null;
  let errorMessage: string | null = null;

  try {
    inspection = await inspectAuthToken(token);
  } catch (error) {
    errorMessage =
      error instanceof NotFoundError
        ? error.message
        : "This link is invalid or has expired.";
  }

  if (!inspection) {
    return (
      <AuthPanel
        title="Link expired"
        description={errorMessage ?? "This link is invalid or has expired."}
      >
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-primary hover:underline"
        >
          Request a new reset link →
        </Link>
      </AuthPanel>
    );
  }

  const isInvite = inspection.purpose === "INVITE";
  const mode = isInvite
    ? inspection.user.hasPassword
      ? "invite-accept"
      : "invite-set-password"
    : "reset";

  return (
    <AuthPanel
      title={isInvite ? "Accept invitation" : "Choose a new password"}
      description={
        isInvite
          ? `You are joining as ${inspection.user.email}.`
          : `Reset password for ${inspection.user.email}.`
      }
    >
      <ResetPasswordForm
        token={token}
        mode={mode}
        organizationName={inspection.organization?.name}
      />
    </AuthPanel>
  );
}
