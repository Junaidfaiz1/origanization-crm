"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  loginAction,
  registerAction,
  forgotPasswordAction,
  resetPasswordAction,
  type AuthFormState,
} from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthFormState = {};

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) {
    return null;
  }
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      {notice ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm" role="status">
          {notice}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError messages={state.errors?.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError messages={state.errors?.password} />
      </div>
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Signing in..." : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/forgot-password" className="hover:text-foreground">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState);

  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" name="name" required />
        <FieldError messages={state.errors?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organizationName">Organization</Label>
        <Input id="organizationName" name="organizationName" required />
        <FieldError messages={state.errors?.organizationName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError messages={state.errors?.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError messages={state.errors?.password} />
      </div>
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Creating workspace..." : "Create workspace"}
      </Button>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    forgotPasswordAction,
    initialState,
  );

  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm" role="status">
          {state.message}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
        <FieldError messages={state.errors?.email} />
      </div>
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Sending..." : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({
  token,
  mode,
  organizationName,
}: {
  token: string;
  mode: "reset" | "invite-set-password" | "invite-accept";
  organizationName?: string | null;
}) {
  const [state, action, pending] = useActionState(
    resetPasswordAction,
    initialState,
  );

  const isAcceptOnly = mode === "invite-accept";
  const titleAction =
    mode === "reset"
      ? pending
        ? "Updating..."
        : "Update password"
      : isAcceptOnly
        ? pending
          ? "Accepting..."
          : "Accept invitation"
        : pending
          ? "Saving..."
          : "Set password & join";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {isAcceptOnly ? (
        <input type="hidden" name="acceptOnly" value="true" />
      ) : null}
      {organizationName ? (
        <p className="rounded-md bg-muted px-3 py-2 text-sm" role="status">
          Join {organizationName}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      {!isAcceptOnly ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
            />
            <FieldError messages={state.errors?.password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
            />
            <FieldError messages={state.errors?.confirmPassword} />
          </div>
        </>
      ) : null}
      <Button className="w-full" disabled={pending} type="submit">
        {titleAction}
      </Button>
    </form>
  );
}
