import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card>
        <CardHeader>
          <CardTitle>Invalid link</CardTitle>
          <CardDescription>
            This password link is missing a token. Request a new one from the sign-in page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm underline">
            Request reset link
          </Link>
        </CardContent>
      </Card>
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
      <Card>
        <CardHeader>
          <CardTitle>Link expired</CardTitle>
          <CardDescription>
            {errorMessage ?? "This link is invalid or has expired."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/forgot-password" className="text-sm underline">
            Request a new reset link
          </Link>
        </CardContent>
      </Card>
    );
  }

  const isInvite = inspection.purpose === "INVITE";
  const mode = isInvite
    ? inspection.user.hasPassword
      ? "invite-accept"
      : "invite-set-password"
    : "reset";

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isInvite ? "Accept invitation" : "Choose a new password"}
        </CardTitle>
        <CardDescription>
          {isInvite
            ? `You are joining as ${inspection.user.email}.`
            : `Reset password for ${inspection.user.email}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm
          token={token}
          mode={mode}
          organizationName={inspection.organization?.name}
        />
      </CardContent>
    </Card>
  );
}
