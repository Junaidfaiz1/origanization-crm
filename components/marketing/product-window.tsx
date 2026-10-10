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
        "w-full max-w-full overflow-hidden rounded-xl border border-[var(--mk-line)] bg-[var(--mk-surface)] shadow-[0_30px_80px_rgb(17_20_26_/_0.14)]",
        className,
      )}
      data-cursor="panel"
    >
      <div className="flex items-center gap-2 border-b border-[var(--mk-line)] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex shrink-0 gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
        </div>
        <p className="min-w-0 flex-1 truncate text-center text-[11px] tracking-[0.06em] text-[var(--mk-muted)] sm:tracking-[0.06em]">
          {title}
        </p>
        <span className="hidden sm:inline">
          <DemoBadge>{badge}</DemoBadge>
        </span>
      </div>

      {/* Mobile workspace pills */}
      <div className="flex gap-1.5 overflow-x-auto border-b border-[var(--mk-line)] px-3 py-2 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {NAV.map((item) => (
          <span
            key={item}
            className={cn(
              "shrink-0 rounded-md px-2.5 py-1 text-[11px]",
              item === activeNav
                ? "bg-[#eef1fe] font-semibold text-[#1a33b0]"
                : "text-[var(--mk-muted)]",
            )}
          >
            {item}
          </span>
        ))}
      </div>

      <div
        className={cn(
          "flex",
          compact ? "min-h-[10rem] sm:min-h-[12rem]" : "min-h-[14rem] sm:min-h-[18rem]",
        )}
      >
        <aside className="hidden w-36 shrink-0 border-r border-[var(--mk-line)] bg-[var(--mk-surface)] p-3 md:block">
          <p className="mb-3 px-2 text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--mk-muted)]">
            Workspace
          </p>
          <ul className="space-y-0.5">
            {NAV.map((item) => (
              <li key={item}>
                <span
                  className={cn(
                    "block rounded-md px-2 py-1.5 text-xs",
                    item === activeNav
                      ? "bg-[#eef1fe] font-semibold text-[#1a33b0]"
                      : "text-[var(--mk-text-2)]",
                  )}
                >
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </aside>
        <div className="min-w-0 flex-1 overflow-x-auto p-3 sm:p-4 md:p-5">
          {children}
        </div>
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
      className={cn("flex h-20 items-end gap-0.5 sm:h-24 sm:gap-1", className)}
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
    <div className="min-w-0 rounded-lg border border-[var(--mk-line)] bg-[var(--mk-tint)] p-2.5 sm:p-3">
      <p className="truncate text-[11px] uppercase tracking-[0.06em] text-[var(--mk-muted)] sm:tracking-[0.06em]">
        {label}
      </p>
      <p className="mt-1.5 truncate text-base font-medium tracking-tight text-[var(--mk-text)] sm:mt-2 sm:text-lg">
        {value}
      </p>
      {delta ? (
        <p className="mt-1 text-[11px] text-[var(--mk-blue)] sm:text-xs">{delta}</p>
      ) : null}
    </div>
  );
}
