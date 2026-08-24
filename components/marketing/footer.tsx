import Link from "next/link";
import { BRAND } from "@/lib/marketing/copy";
import {
  COMPANY_NAV,
  MARKETING_ROUTES,
  PRODUCT_NAV,
  RESOURCE_NAV,
  SOLUTION_NAV,
} from "@/lib/marketing/routes";
import { MagneticButton } from "@/components/marketing/primitives";

function Col({
  title,
  items,
}: {
  title: string;
  items: readonly { href: string; title: string }[];
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-[var(--mk-muted)]">
        {title}
      </p>
      <ul className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="mk-underline text-sm text-[var(--mk-text-2)] hover:text-[var(--mk-text)]"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative border-t border-white/10 bg-[#050505]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 border-b border-white/[0.06] pb-12 sm:pb-16 lg:grid-cols-[1.2fr_2fr]">
          <div>
            <p className="font-[family-name:var(--font-marketing-display)] text-3xl text-[var(--mk-text)] sm:text-4xl">
              {BRAND.name}
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--mk-text-2)] sm:mt-4">
              One workspace for the business behind the work.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 xs:gap-8 sm:grid-cols-4 sm:gap-8">
            <Col title="Product" items={PRODUCT_NAV} />
            <Col title="Solutions" items={SOLUTION_NAV} />
            <Col title="Company" items={COMPANY_NAV} />
            <Col title="Resources" items={RESOURCE_NAV} />
          </div>
        </div>

        <div className="grid gap-6 py-12 sm:gap-8 sm:py-16 lg:grid-cols-[1.4fr_auto] lg:items-end">
          <div>
            <h2 className="mk-display max-w-xl text-2xl text-[var(--mk-text)] sm:text-4xl">
              Ready to run the whole business from one place?
            </h2>
          </div>
          <MagneticButton href="/register" className="w-full sm:w-auto">
            Start building
          </MagneticButton>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/[0.06] pt-8 text-xs text-[var(--mk-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href={MARKETING_ROUTES.security}
              className="hover:text-[var(--mk-text-2)]"
            >
              Privacy
            </Link>
            <Link
              href={MARKETING_ROUTES.security}
              className="hover:text-[var(--mk-text-2)]"
            >
              Terms
            </Link>
            <Link
              href={MARKETING_ROUTES.contact}
              className="hover:text-[var(--mk-text-2)]"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
