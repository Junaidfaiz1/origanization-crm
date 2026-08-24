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

const fieldClass =
  "h-11 border-white/10 bg-white/[0.03] text-[var(--mk-text)] placeholder:text-[var(--mk-muted)] focus-visible:border-[var(--mk-bronze)]/50 focus-visible:ring-[var(--mk-bronze)]/20";

const labelClass = "text-[var(--mk-text-2)]";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="text-sm text-rose-300/90">{messages[0]}</p>;
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
        "mk-focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[var(--mk-bronze)] px-4 text-sm font-medium tracking-wide text-[#1a120c] transition-[transform,background-color,opacity] duration-300 hover:-translate-y-0.5 hover:bg-[var(--mk-warm)] disabled:pointer-events-none disabled:opacity-60",
      )}
    >
      {pending ? busy : idle}
      <span aria-hidden>→</span>
    </button>
  );
}

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);

  return (
    <form action={action} className="space-y-4">
      {notice ? (
        <p
          className="rounded-md border border-[var(--mk-bronze)]/25 bg-[var(--mk-bronze)]/10 px-3 py-2 text-sm text-[var(--mk-warm)]"
          role="status"
        >
          {notice}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-md border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
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
      <p className="text-center text-sm text-[var(--mk-muted)]">
        <Link
          href="/forgot-password"
          className="mk-underline text-[var(--mk-text-2)] hover:text-[var(--mk-text)]"
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
        <p className="rounded-md border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
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
          className="rounded-md border border-[var(--mk-bronze)]/25 bg-[var(--mk-bronze)]/10 px-3 py-2 text-sm text-[var(--mk-warm)]"
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
      <p className="text-center text-sm text-[var(--mk-muted)]">
        <Link
          href="/login"
          className="mk-underline text-[var(--mk-text-2)] hover:text-[var(--mk-text)]"
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
          className="rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-[var(--mk-text-2)]"
          role="status"
        >
          Join {organizationName}
        </p>
      ) : null}
      {state.message ? (
        <p className="rounded-md border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
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
