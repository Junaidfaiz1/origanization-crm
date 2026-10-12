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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

const initialState: AuthFormState = {};

const fieldClass = "h-11 md:h-11 md:text-[15px]";

const labelClass = "text-sm font-medium text-foreground";

const errorBoxClass =
  "rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive";

const noticeBoxClass =
  "rounded-lg border border-success/20 bg-success/10 px-3 py-2.5 text-sm text-success";

const linkClass = "font-medium text-primary hover:underline";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-sm text-destructive">{messages[0]}</p>;
}

function AuthSubmit({
  pending,
  idle,
  busy,
}: {
  pending: boolean;
  idle: string;
  busy: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60",
      )}
    >
      {pending ? busy : idle}
    </button>
  );
}

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      {notice ? (
        <p
          className={noticeBoxClass}
          role="status"
        >
          {notice}
        </p>
      ) : null}
      {state.message ? (
        <p className={errorBoxClass}>
          {state.message}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email" className={labelClass}>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          className={fieldClass}
        />
        <FieldError messages={state.errors?.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className={labelClass}>
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className={fieldClass}
        />
        <FieldError messages={state.errors?.password} />
      </div>
      <AuthSubmit pending={pending} idle="Sign in" busy="Signing in..." />
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/forgot-password"
          className={linkClass}
        >
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
        <p className={errorBoxClass}>
          {state.message}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name" className={labelClass}>
          Full name
        </Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Jane Doe"
          className={fieldClass}
        />
        <FieldError messages={state.errors?.name} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="organizationName" className={labelClass}>
          Organization
        </Label>
        <Input
          id="organizationName"
          name="organizationName"
          required
          placeholder="Acme Agency"
          className={fieldClass}
        />
        <FieldError messages={state.errors?.organizationName} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email" className={labelClass}>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@company.com"
          className={fieldClass}
        />
        <FieldError messages={state.errors?.email} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password" className={labelClass}>
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          placeholder="At least 8 characters"
          className={fieldClass}
        />
        <FieldError messages={state.errors?.password} />
      </div>
      <AuthSubmit
        pending={pending}
        idle="Create workspace"
        busy="Creating workspace..."
      />
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
        <p
          className={noticeBoxClass}
          role="status"
        >
          {state.message}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email" className={labelClass}>
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@company.com"
          className={fieldClass}
        />
        <FieldError messages={state.errors?.email} />
      </div>
      <AuthSubmit
        pending={pending}
        idle="Send reset link"
        busy="Sending..."
      />
      <p className="text-center text-sm text-muted-foreground">
        <Link
          href="/login"
          className={linkClass}
        >
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
  const idle =
    mode === "reset"
      ? "Update password"
      : isAcceptOnly
        ? "Accept invitation"
        : "Set password & join";
  const busy =
    mode === "reset"
      ? "Updating..."
      : isAcceptOnly
        ? "Accepting..."
        : "Saving...";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      {isAcceptOnly ? (
        <input type="hidden" name="acceptOnly" value="true" />
      ) : null}
      {organizationName ? (
        <p
          className="rounded-lg border border-border bg-muted px-3 py-2.5 text-sm text-foreground"
          role="status"
        >
          Join {organizationName}
        </p>
      ) : null}
      {state.message ? (
        <p className={errorBoxClass}>
          {state.message}
        </p>
      ) : null}
      {!isAcceptOnly ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="password" className={labelClass}>
              New password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              placeholder="At least 8 characters"
              className={fieldClass}
            />
            <FieldError messages={state.errors?.password} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className={labelClass}>
              Confirm password
            </Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              placeholder="Re-enter password"
              className={fieldClass}
            />
            <FieldError messages={state.errors?.confirmPassword} />
          </div>
        </>
      ) : null}
      <AuthSubmit pending={pending} idle={idle} busy={busy} />
    </form>
  );
}
