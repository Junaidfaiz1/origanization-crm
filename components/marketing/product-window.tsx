"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { DemoBadge } from "@/components/marketing/primitives";

const NAV = [
  "Overview",
  "Clients",
  "Projects",
  "Bidding",
  "Finance",
  "Analytics",
] as const;

export function ProductWindow({
  title = "TECHNOVA",
  activeNav = "Overview",
  badge = "Product preview",
  children,
  className,
  compact,
}: {
  title?: string;
  activeNav?: (typeof NAV)[number] | string;
  badge?: string;
  children: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-[#0c0c0c] shadow-[0_40px_120px_rgb(0_0_0_/_0.55)]",
        className,
      )}
      data-cursor="panel"
    >
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
        </div>
        <p className="flex-1 truncate text-center text-[11px] tracking-[0.2em] text-[var(--mk-muted)]">
          {title}
        </p>
        <DemoBadge>{badge}</DemoBadge>
      </div>
      <div className={cn("flex", compact ? "min-h-[12rem]" : "min-h-[18rem]")}>
        <aside className="hidden w-36 shrink-0 border-r border-white/[0.06] bg-[#090909] p-3 sm:block">
          <p className="mb-3 px-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--mk-muted)]">
            Workspace
          </p>
          <ul className="space-y-0.5">
            {NAV.map((item) => (
              <li key={item}>
                <span
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-xs",
                    item === activeNav
                      ? "bg-white/[0.06] text-[var(--mk-warm)]"
                      : "text-[var(--mk-text-2)]",
                  )}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0 flex-1 p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}

export function SparkBars({
  values,
  className,
  color = "var(--mk-bronze)",
}: {
  values: readonly number[];
  className?: string;
  color?: string;
}) {
  const max = Math.max(...values, 1);
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setDrawn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      className={cn("flex h-24 items-end gap-1", className)}
      role="img"
      aria-label="Chart preview"
    >
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-[height] duration-700 ease-out"
          style={{
            height: drawn ? `${(v / max) * 100}%` : "8%",
            background: `linear-gradient(180deg, ${color}, transparent)`,
            opacity: 0.35 + (v / max) * 0.65,
            transitionDelay: `${i * 40}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function MetricTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: string;
}) {
  return (
    <div className="rounded-lg border border-white/[0.07] bg-white/[0.02] p-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-[var(--mk-muted)]">
        {label}
      </p>
      <p className="mt-2 text-lg font-medium tracking-tight text-[var(--mk-text)]">
        {value}
      </p>
      {delta ? (
        <p className="mt-1 text-xs text-[var(--mk-blue)]">{delta}</p>
      ) : null}
    </div>
  );
}
