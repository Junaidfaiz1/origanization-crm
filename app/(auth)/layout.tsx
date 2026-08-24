import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/marketing/copy";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-root relative min-h-dvh">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute inset-0 mk-radial-glow opacity-90" />
        <div className="absolute inset-0 mk-noise" />
        <div className="absolute inset-0 mk-editorial-grid opacity-25" />
      </div>

      <div className="grid min-h-dvh lg:grid-cols-2">
        {/* Mobile brand bar */}
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 lg:hidden pt-[max(0.75rem,env(safe-area-inset-top))]">
          <Link href="/" className="flex min-w-0 items-baseline gap-2">
            <span className="font-[family-name:var(--font-marketing-display)] text-2xl tracking-wide text-[var(--mk-text)]">
              {BRAND.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--mk-muted)]">
              CRM
            </span>
          </Link>
        </div>

        {/* Desktop cinematic panel */}
        <div className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between p-10 xl:p-14">
          <Link href="/" className="flex items-baseline gap-2">
            <span className="font-[family-name:var(--font-marketing-display)] text-3xl tracking-wide text-[var(--mk-text)]">
              {BRAND.name}
            </span>
            <span className="text-[10px] uppercase tracking-[0.22em] text-[var(--mk-muted)]">
              CRM
            </span>
          </Link>

          <div className="max-w-md space-y-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mk-bronze)]">
              Workspace
            </p>
            <h1 className="mk-display text-4xl leading-[1.08] text-[var(--mk-text)] xl:text-5xl">
              Win the client.
              <span className="mt-2 block text-[var(--mk-text-2)]">
                Then run the business.
              </span>
            </h1>
            <p className="text-sm leading-relaxed text-[var(--mk-text-2)]">
              {BRAND.pitch}
            </p>
          </div>

          <p className="text-xs text-[var(--mk-muted)]">
            One workspace for CRM, bidding, delivery, and profitability.
          </p>
        </div>

        {/* Form column */}
        <div className="flex items-start justify-center overflow-y-auto px-4 py-10 sm:items-center sm:p-10 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="w-full max-w-md">
            {children}
            <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-[var(--mk-muted)]">
              <Link
                href="/login"
                className="mk-underline inline-flex min-h-11 items-center text-[var(--mk-text-2)] hover:text-[var(--mk-text)]"
              >
                Sign in
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                href="/register"
                className="mk-underline inline-flex min-h-11 items-center text-[var(--mk-text-2)] hover:text-[var(--mk-text)]"
              >
                Create workspace
              </Link>
              <span aria-hidden="true">·</span>
              <Link
                href="/"
                className="mk-underline inline-flex min-h-11 items-center text-[var(--mk-text-2)] hover:text-[var(--mk-text)]"
              >
                Home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
