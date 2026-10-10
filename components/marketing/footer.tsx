import Link from "next/link";
import { BRAND } from "@/lib/marketing/copy";
import {
  COMPANY_NAV,
  PRODUCT_NAV,
  RESOURCE_NAV,
  SOLUTION_NAV,
} from "@/lib/marketing/routes";

function Col({
  title,
  items,
}: {
  title: string;
  items: readonly { href: string; title: string }[];
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--mk-muted)]">
        {title}
      </p>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.href + item.title}>
            <Link
              href={item.href}
              className="text-[15px] text-[#e4e7ec] transition-colors hover:text-white"
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
    <footer className="mk-ink relative">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-12">
          <div className="flex min-w-[16rem] flex-1 flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-[#2443d9] font-display text-sm font-bold text-white">
                TN
              </span>
              <span className="font-display text-[19px] font-semibold">{BRAND.name}</span>
            </div>
            <p className="max-w-xs text-[15px] leading-relaxed text-[var(--mk-text-2)]">
              {BRAND.tagline}
            </p>
          </div>
          <div className="grid flex-[2] grid-cols-2 gap-8 sm:grid-cols-4">
            <Col title="Product" items={PRODUCT_NAV} />
            <Col title="Solutions" items={SOLUTION_NAV} />
            <Col title="Resources" items={RESOURCE_NAV} />
            <Col title="Company" items={COMPANY_NAV} />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[var(--mk-line)] pt-6 text-[13px] text-[var(--mk-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {BRAND.legalName}
          </p>
          <Link href="/login" className="text-[var(--mk-text-2)] hover:text-white">
            Sign in
          </Link>
        </div>
      </div>
    </footer>
  );
}
