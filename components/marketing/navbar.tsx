"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import {
  COMPANY_NAV,
  PRODUCT_NAV,
  RESOURCE_NAV,
  SOLUTION_NAV,
  MARKETING_ROUTES,
} from "@/lib/marketing/routes";
import { cn } from "@/lib/utils/cn";

type MenuKey = "product" | "solutions" | "resources" | "company" | null;

function MegaPanel({
  items,
  onNavigate,
}: {
  items: readonly { href: string; title: string; description: string }[];
  onNavigate: () => void;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavigate}
          className="group rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-[var(--mk-line)] hover:bg-[var(--mk-tint-2)]"
          data-cursor="link"
        >
          <p className="text-sm font-medium text-[var(--mk-text)] group-hover:text-[var(--mk-warm)]">
            {item.title}
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--mk-muted)]">
            {item.description}
          </p>
        </Link>
      ))}
    </div>
  );
}

function NavTrigger({
  label,
  open,
  onClick,
}: {
  label: string;
  open: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={cn(
        "mk-focus-ring inline-flex h-10 items-center gap-1.5 rounded-[10px] px-3.5 text-[15px] font-medium text-[var(--mk-text-2)] transition-colors hover:bg-[var(--mk-tint)] hover:text-[var(--mk-text)]",
        open && "bg-[var(--mk-tint)] text-[var(--mk-text)]",
      )}
      aria-expanded={open}
      onClick={onClick}
      data-cursor="link"
    >
      {label}
      <ChevronDown
        className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
      />
    </button>
  );
}

export function MarketingNavbar() {
  const [menu, setMenu] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<MenuKey>(null);
  const [scrolled, setScrolled] = useState(false);
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setMenu(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setMenu(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const panels: Record<
    Exclude<MenuKey, null>,
    readonly { href: string; title: string; description: string }[]
  > = {
    product: PRODUCT_NAV,
    solutions: SOLUTION_NAV,
    resources: RESOURCE_NAV,
    company: COMPANY_NAV,
  };

  return (
    <header
      ref={rootRef}
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b bg-[var(--mk-bg)] transition-[border-color,box-shadow] duration-300",
        scrolled
          ? "border-[var(--mk-line)] shadow-[0_1px_2px_rgb(17_20_26_/_0.04)]"
          : "border-[var(--mk-line)]",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-[72px] sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href={MARKETING_ROUTES.home}
          className="mk-focus-ring group flex min-w-0 items-center gap-2.5"
          data-cursor="link"
        >
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[var(--mk-bronze)] font-display text-sm font-bold text-[var(--mk-on-accent)]">
            TN
          </span>
          <span className="font-display text-[19px] font-semibold text-[var(--mk-text)]">
            Technova
          </span>
        </Link>

        <nav className="relative hidden items-center gap-1 lg:flex" aria-label="Primary">
          {(
            [
              ["product", "Product"],
              ["solutions", "Solutions"],
              ["resources", "Resources"],
              ["company", "Company"],
            ] as const
          ).map(([key, label]) => (
            <NavTrigger
              key={key}
              label={label}
              open={menu === key}
              onClick={() => setMenu(menu === key ? null : key)}
            />
          ))}

          {menu ? (
            <div className="absolute left-1/2 top-full z-50 mt-3 w-[min(36rem,90vw)] -translate-x-1/2 rounded-xl border border-[var(--mk-line)] bg-[var(--mk-surface)] p-3 shadow-[0_20px_50px_rgb(17_20_26_/_0.12)]">
              <MegaPanel items={panels[menu]} onNavigate={() => setMenu(null)} />
            </div>
          ) : null}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="mk-focus-ring inline-flex h-10 items-center rounded-[10px] px-3.5 text-[15px] font-medium text-[var(--mk-text)] hover:bg-[var(--mk-tint)]"
            data-cursor="link"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="mk-focus-ring inline-flex h-10 items-center rounded-[10px] bg-[var(--mk-ink)] px-[18px] text-[15px] font-semibold text-white hover:bg-[#262b35]"
          >
            Start free
          </Link>
        </div>

        <button
          type="button"
          className="mk-focus-ring rounded-md border border-[var(--mk-line)] p-2 text-[var(--mk-text)] lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[var(--mk-line)] bg-[var(--mk-bg)] px-4 py-4 lg:hidden">
          {(
            [
              ["product", "Product", PRODUCT_NAV],
              ["solutions", "Solutions", SOLUTION_NAV],
              ["resources", "Resources", RESOURCE_NAV],
              ["company", "Company", COMPANY_NAV],
            ] as const
          ).map(([key, label, items]) => (
            <div key={key} className="border-b border-[var(--mk-line)] py-2">
              <button
                type="button"
                className="flex w-full items-center justify-between py-2 text-sm text-[var(--mk-text)]"
                onClick={() =>
                  setMobileSection(mobileSection === key ? null : key)
                }
              >
                {label}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    mobileSection === key && "rotate-180",
                  )}
                />
              </button>
              {mobileSection === key ? (
                <div className="pb-2">
                  <MegaPanel
                    items={items}
                    onNavigate={() => setMobileOpen(false)}
                  />
                </div>
              ) : null}
            </div>
          ))}
          <div className="mt-4 flex flex-col gap-2">
            <Link
              href="/login"
              className="rounded-xl border border-[var(--mk-line)] px-4 py-3 text-center text-sm font-medium"
              onClick={() => setMobileOpen(false)}
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-xl bg-[var(--mk-ink)] px-4 py-3 text-center text-sm font-semibold text-white"
              onClick={() => setMobileOpen(false)}
            >
              Start free
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
