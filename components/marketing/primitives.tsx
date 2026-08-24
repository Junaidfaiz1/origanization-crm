"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type MouseEvent,
  type RefObject,
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
  const ref = useRef<HTMLElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  function onMove(e: MouseEvent) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setOffset({ x: x * 0.18, y: y * 0.18 });
  }

  function onLeave() {
    setOffset({ x: 0, y: 0 });
  }

  const styles = cn(
    "mk-focus-ring group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-md px-6 py-3 text-sm font-medium tracking-wide transition-[transform,box-shadow,background-color,border-color] duration-300 will-change-transform",
    variant === "primary" &&
      "bg-[var(--mk-bronze)] text-[#1a120c] shadow-[0_0_0_1px_rgb(232_178_123_/_0.25)] hover:-translate-y-0.5 hover:bg-[var(--mk-warm)]",
    variant === "secondary" &&
      "border border-white/15 bg-white/[0.03] text-[var(--mk-text)] hover:-translate-y-0.5 hover:border-[var(--mk-bronze)]/50 hover:bg-white/[0.06]",
    variant === "ghost" &&
      "text-[var(--mk-text-2)] hover:text-[var(--mk-text)]",
    className,
  );

  const motionStyle = {
    transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
  };

  if (href) {
    return (
      <Link
        ref={ref as RefObject<HTMLAnchorElement>}
        href={href}
        className={styles}
        style={motionStyle}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        data-cursor="magnetic"
      >
        {children}
        <span
          className="translate-x-0 transition-transform duration-300 group-hover:translate-x-1"
          aria-hidden
        >
          →
        </span>
      </Link>
    );
  }

  return (
    <button
      ref={ref as RefObject<HTMLButtonElement>}
      type={type}
      className={styles}
      style={motionStyle}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onClick={onClick}
      data-cursor="magnetic"
    >
      {children}
      <span
        className="translate-x-0 transition-transform duration-300 group-hover:translate-x-1"
        aria-hidden
      >
        →
      </span>
    </button>
  );
}

export function DemoBadge({ children = "Demo data" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--mk-muted)]">
      {children}
    </span>
  );
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mk-bronze)]">
      {children}
    </p>
  );
}

export function SectionHeading({
  title,
  accent,
  lead,
  className,
}: {
  title: ReactNode;
  accent?: ReactNode;
  lead?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("max-w-3xl", className)}>
      <h2 className="mk-display text-balance text-[1.85rem] leading-[1.1] text-[var(--mk-text)] sm:text-5xl lg:text-6xl">
        {title}
        {accent ? (
          <span className="mt-2 block text-[var(--mk-text-2)]">{accent}</span>
        ) : null}
      </h2>
      {lead ? (
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--mk-text-2)] sm:mt-6 sm:text-lg">
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
