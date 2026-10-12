import type { ReactNode } from "react";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="marketing-root min-h-dvh">
      <MarketingNavbar />
      <main className="relative pt-16 sm:pt-[72px]">{children}</main>
      <MarketingFooter />
    </div>
  );
}
