import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex items-center gap-3 border-b border-border bg-sidebar px-4 py-3 text-sidebar-foreground lg:hidden pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
          TN
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">TechNova CRM</p>
          <p className="truncate text-xs text-sidebar-muted">
            Clients, bids, and delivery
          </p>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:justify-between p-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground">
            TN
          </div>
          <span className="text-lg font-semibold">TechNova CRM</span>
        </div>
        <div className="max-w-md space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight xl:text-4xl">
            Run clients, bids, and delivery in one workspace.
          </h1>
          <p className="text-sm leading-6 text-sidebar-muted">
            A multi-tenant CRM for agencies and software houses — from lead to
            proposal, bid award, invoice, and profit.
          </p>
        </div>
        <p className="text-xs text-sidebar-muted">
          Portfolio-grade modular SaaS · PostgreSQL tenant isolation
        </p>
      </div>

      <div className="flex items-start justify-center overflow-y-auto px-4 py-8 sm:items-center sm:p-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-md">
          {children}
          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-muted-foreground">
            <Link href="/login" className="min-h-11 inline-flex items-center hover:text-foreground">
              Sign in
            </Link>
            <span aria-hidden="true">·</span>
            <Link
              href="/register"
              className="min-h-11 inline-flex items-center hover:text-foreground"
            >
              Create workspace
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
