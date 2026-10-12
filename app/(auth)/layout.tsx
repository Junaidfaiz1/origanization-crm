import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/marketing/copy";

const LIFECYCLE = ["Lead", "Proposal", "Bid", "Project", "Invoice"] as const;

function BrandMark({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className={
          inverted
            ? "flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary font-display text-sm font-bold text-primary-foreground"
            : "flex h-9 w-9 items-center justify-center rounded-[10px] bg-foreground font-display text-sm font-bold text-background"
        }
      >
        TN
      </span>
      <span className="font-display text-lg font-semibold">{BRAND.name}</span>
    </Link>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-card text-foreground lg:grid-cols-2">
      {/* Mobile brand bar */}
      <div className="flex items-center border-b border-border px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] lg:hidden">
        <BrandMark />
      </div>

      {/* Desktop ink panel */}
      <div className="relative hidden flex-col justify-between gap-12 bg-[#11141a] p-10 text-white lg:flex xl:p-12">
        <BrandMark inverted />

        <div className="max-w-lg space-y-7">
          {/* Not an h1: each auth page's form title is the page heading. */}
          <p className="font-display text-[44px] font-semibold leading-[1.08] tracking-[-0.025em]">
            From first lead to final invoice, in one place.
          </p>
          <p className="text-base leading-relaxed text-[#c3c8d2]">{BRAND.pitch}</p>
          {/* One line at every desktop width: numbers only appear once the panel is wide enough (xl). */}
          <ol className="flex flex-nowrap items-center gap-1.5 whitespace-nowrap">
            {LIFECYCLE.map((step, index) => {
              const last = index === LIFECYCLE.length - 1;
              return (
                <li key={step} className="flex shrink-0 items-center gap-1.5">
                  <span
                    className={
                      last
                        ? "inline-flex h-8 items-center gap-1.5 rounded-full border border-primary bg-primary px-2.5 text-[13px] font-medium"
                        : "inline-flex h-8 items-center gap-1.5 rounded-full border border-[#3b4250] px-2.5 text-[13px] font-medium"
                    }
                  >
                    <span
                      className={
                        last
                          ? "hidden font-mono text-[11px] text-[#dce3fd] xl:inline"
                          : "hidden font-mono text-[11px] text-[#8e95a3] xl:inline"
                      }
                    >
                      0{index + 1}
                    </span>
                    {step}
                  </span>
                  {!last ? (
                    <span aria-hidden className="text-xs text-[#5b6271]">
                      →
                    </span>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        <p className="text-[13px] text-[#8e95a3]">
          Multi-tenant · role-based access · data isolated per organization
        </p>
      </div>

      {/* Form column */}
      <div className="flex items-start justify-center overflow-y-auto px-4 py-10 pb-[max(2rem,env(safe-area-inset-bottom))] sm:items-center sm:p-10">
        <div className="w-full max-w-[400px]">
          {children}
          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-sm text-muted-foreground">
            <Link href="/login" className="inline-flex min-h-11 items-center hover:text-foreground">
              Sign in
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/register" className="inline-flex min-h-11 items-center hover:text-foreground">
              Create workspace
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/" className="inline-flex min-h-11 items-center hover:text-foreground">
              Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
