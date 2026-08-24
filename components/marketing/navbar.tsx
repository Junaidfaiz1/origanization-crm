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
import { MagneticButton } from "@/components/marketing/primitives";
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
          className="group rounded-lg border border-transparent px-3 py-3 transition-colors hover:border-white/10 hover:bg-white/[0.03]"
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
        "mk-focus-ring inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm text-[var(--mk-text-2)] transition-colors hover:text-[var(--mk-text)]",
        open && "text-[var(--mk-text)]",
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
        "fixed inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color,padding] duration-300",
        scrolled
          ? "border-b border-white/10 bg-[#050505]/72 py-2 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent py-4",
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href={MARKETING_ROUTES.home}
          className="mk-focus-ring group flex min-w-0 items-baseline gap-2"
          data-cursor="link"
        >
          <span className="font-[family-name:var(--font-marketing-display)] text-xl tracking-wide text-[var(--mk-text)] sm:text-2xl">
            Technova
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.22em] text-[var(--mk-muted)] sm:inline">
            CRM
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
            <div className="absolute left-1/2 top-full z-50 mt-3 w-[min(36rem,90vw)] -translate-x-1/2 rounded-xl border border-white/10 bg-[#0c0c0c]/95 p-3 shadow-[0_30px_80px_rgb(0_0_0_/_0.55)] backdrop-blur-xl">
              <MegaPanel items={panels[menu]} onNavigate={() => setMenu(null)} />
            </div>
          ) : null}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="mk-focus-ring rounded-md px-3 py-2 text-sm text-[var(--mk-text-2)] hover:text-[var(--mk-text)]"
            data-cursor="link"
          >
            Login
          </Link>
          <MagneticButton href="/register" className="!px-4 !py-2 text-xs">
            Get started
          </MagneticButton>
        </div>

        <button
          type="button"
          className="mk-focus-ring rounded-md border border-white/10 p-2 text-[var(--mk-text)] lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-white/10 bg-[#050505] px-4 py-4 lg:hidden">
          {(
            [
              ["product", "Product", PRODUCT_NAV],
              ["solutions", "Solutions", SOLUTION_NAV],
              ["resources", "Resources", RESOURCE_NAV],
              ["company", "Company", COMPANY_NAV],
            ] as const
          ).map(([key, label, items]) => (
            <div key={key} className="border-b border-white/[0.06] py-2">
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
              className="rounded-md border border-white/10 px-4 py-3 text-center text-sm"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-md bg-[var(--mk-bronze)] px-4 py-3 text-center text-sm font-medium text-[#1a120c]"
              onClick={() => setMobileOpen(false)}
            >
              Get started
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  );
}
