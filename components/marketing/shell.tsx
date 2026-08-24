import type { ReactNode } from "react";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { CustomCursor } from "@/components/marketing/custom-cursor";

export function MarketingShell({
  children,
  showCursor = true,
}: {
  children: ReactNode;
  showCursor?: boolean;
}) {
  return (
    <div className="marketing-root min-h-dvh">
      {showCursor ? <CustomCursor /> : null}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#050505]" />
        <div className="absolute inset-0 mk-radial-glow opacity-80" />
        <div className="absolute inset-0 mk-noise" />
      </div>
      <MarketingNavbar />
      <main className="relative pt-20">{children}</main>
      <MarketingFooter />
    </div>
  );
}
