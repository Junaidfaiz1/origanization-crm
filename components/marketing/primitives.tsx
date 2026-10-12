"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function MagneticButton({
  children,
  className,
  href,
  onClick,
  variant = "primary",
  type = "button",
}: {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  type?: "button" | "submit";
}) {
  // Name kept for existing imports; the redesign drops the magnetic pointer motion.
  const styles = cn(
    "mk-focus-ring group inline-flex min-h-[52px] items-center justify-center gap-2.5 rounded-xl px-6 text-[15px] font-semibold transition-colors duration-200",
    variant === "primary" &&
      "bg-[var(--mk-bronze)] text-[var(--mk-on-accent)] hover:bg-[var(--mk-warm)]",
    variant === "secondary" &&
      "border border-[var(--mk-line)] bg-[var(--mk-surface)] text-[var(--mk-text)] hover:bg-[var(--mk-tint)]",
    variant === "ghost" &&
      "text-[var(--mk-text-2)] hover:text-[var(--mk-text)]",
    className,
  );

  const arrow =
    variant === "primary" ? (
      <span
        className="transition-transform duration-200 group-hover:translate-x-0.5"
        aria-hidden
      >
        →
      </span>
    ) : null;

  if (href) {
    return (
      <Link href={href} className={styles}>
        {children}
        {arrow}
      </Link>
    );
  }

  return (
    <button type={type} className={styles} onClick={onClick}>
      {children}
      {arrow}
    </button>
  );
}

export function DemoBadge({ children = "Demo data" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-[#fef4e2] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#8a5300]">
      {children}
    </span>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[13px] font-medium uppercase tracking-[0.06em] text-[var(--mk-bronze)]">
      {children}
    </p>
  );
}

export function SectionHeading({
  title,
  accent,
  lead,
  className,
  as: Heading = "h2",
}: {
  title: ReactNode;
  accent?: ReactNode;
  lead?: ReactNode;
  className?: string;
  /** Use "h1" when the heading is the page title. */
  as?: "h1" | "h2";
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <Heading className="mk-display text-balance text-[2rem] leading-[1.04] text-[var(--mk-text)] sm:text-5xl lg:text-[56px]">
        {title}
        {accent ? (
          <>
            {" "}
            <span className="mt-1 block text-[var(--mk-muted)]">{accent}</span>
          </>
        ) : null}
      </Heading>
      {lead ? (
        <p className="mt-4 max-w-xl text-base leading-relaxed text-[var(--mk-text-2)] sm:mt-6 sm:text-lg">
          {lead}
        </p>
      ) : null}
    </div>
  );
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reducedMotion = useSyncExternalStore(
    () => () => {},
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
  const [inView, setInView] = useState(false);
  const visible = reducedMotion || inView;

  useEffect(() => {
    if (reducedMotion) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform,filter] duration-700 ease-out",
        visible
          ? "translate-y-0 opacity-100 blur-0"
          : "translate-y-8 opacity-0 blur-[2px]",
        className,
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  decimals = 0,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        if (reduced) {
          setDisplay(value);
          return;
        }
        const start = performance.now();
        const duration = 1200;
        function tick(now: number) {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(value * eased);
          if (t < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  return (
    <span ref={ref}>
      {prefix}
      {display.toLocaleString("en-US", {
        maximumFractionDigits: decimals,
        minimumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
