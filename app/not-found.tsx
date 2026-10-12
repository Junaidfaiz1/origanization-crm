import Link from "next/link";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MagneticButton } from "@/components/marketing/primitives";

export default function NotFound() {
  return (
    <div className="marketing-root mk-grid-bg flex min-h-dvh flex-col bg-[var(--mk-bg-2)]">
      <MarketingNavbar />
      <main className="flex flex-1 items-center justify-center px-6 pt-24 pb-16">
        <div className="flex max-w-xl flex-col items-center gap-5 text-center">
          <span className="font-display text-[96px] font-bold leading-[0.9] tracking-[-0.05em] text-[var(--mk-bronze)] sm:text-[160px]">
            404
          </span>
          <h1 className="mk-display text-3xl sm:text-4xl">This page went off-pipeline.</h1>
          <p className="text-[17px] leading-relaxed text-[var(--mk-text-2)]">
            The link may be old, or the page has moved. Try one of these instead.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-2.5">
            <MagneticButton href="/">Back to home</MagneticButton>
            <MagneticButton href="/features" variant="secondary">
              See features
            </MagneticButton>
            <MagneticButton href="/login" variant="secondary">
              Sign in
            </MagneticButton>
          </div>
          <Link href="/contact" className="text-sm text-[var(--mk-muted)] hover:text-[var(--mk-text)]">
            Contact us
          </Link>
        </div>
      </main>
    </div>
  );
}
