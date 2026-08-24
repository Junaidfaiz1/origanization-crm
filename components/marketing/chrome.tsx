"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMarketingSceneStore } from "@/lib/ui/marketing-scene-store";
import { cn } from "@/lib/utils/cn";

const JOURNEY = [
  { id: "hero", label: "Universe" },
  { id: "problem", label: "Problem" },
  { id: "solution", label: "Solution" },
  { id: "workflow", label: "Flow" },
  { id: "crm", label: "CRM" },
  { id: "sales", label: "Sales" },
  { id: "proposals", label: "Proposals" },
  { id: "projects", label: "Projects" },
  { id: "bidding", label: "Bidding" },
  { id: "resources", label: "Resources" },
  { id: "time", label: "Time" },
  { id: "finance", label: "Finance" },
  { id: "profit", label: "Profit" },
  { id: "client-portal", label: "Clients" },
  { id: "freelancer-portal", label: "Freelancers" },
  { id: "roles", label: "Roles" },
  { id: "dashboard", label: "App" },
  { id: "cta", label: "Start" },
] as const;

export function ScrollJourney() {
  const active = useMarketingSceneStore((s) => s.activeSection);
  const progress = useMarketingSceneStore((s) => s.scrollProgress);
  const current = JOURNEY.find((j) => j.id === active) ?? JOURNEY[0];

  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-30 hidden -translate-x-1/2 md:block">
      <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-white/10 bg-[#060a12]/85 px-4 py-2 shadow-[0_12px_40px_rgb(0_0_0_/_0.45)] backdrop-blur-xl">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-400 shadow-[0_0_10px_rgb(45_212_191_/_0.8)]" />
        <span className="text-[11px] font-medium tracking-wide text-slate-200">
          {current.label}
        </span>
        <div className="h-px w-16 overflow-hidden rounded-full bg-white/10 sm:w-24">
          <div
            className="h-full rounded-full bg-teal-400/90 transition-[width] duration-300"
            style={{ width: `${Math.max(6, progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function FloatingCta() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setVisible(y > 900 && y < max - 700);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-6 right-4 z-30 transition-all duration-500 sm:right-6",
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0",
      )}
    >
      <Link
        href="/register"
        className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/95 px-4 py-2.5 text-sm font-semibold text-teal-950 shadow-[0_12px_40px_rgb(13_148_136_/_0.35)] backdrop-blur-sm hover:bg-teal-400"
      >
        Get started →
      </Link>
    </div>
  );
}
