import Link from "next/link";
import { MagneticButton } from "@/components/marketing/primitives";

export default function NotFound() {
  return (
    <div className="marketing-root relative flex min-h-dvh flex-col items-center justify-center bg-[#050505] px-4 text-[var(--mk-text)]">
      <div className="pointer-events-none absolute inset-0 mk-radial-glow" />
      <div className="relative mx-auto max-w-lg text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-[var(--mk-bronze)]">
          404
        </p>
        <h1 className="mk-display mt-4 text-balance text-4xl leading-[1.08] sm:text-5xl">
          Looks like this page left the workspace.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-[var(--mk-text-2)]">
          The route you opened is not part of Technova — or it moved. Head back
          home and continue from there.
        </p>
        <div className="mt-10 flex justify-center">
          <MagneticButton href="/">Back to Technova</MagneticButton>
        </div>
        <p className="mt-4">
          <Link
            href="/contact"
            className="mk-underline text-xs text-[var(--mk-muted)]"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
}
