"use client";

import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "hero", label: "01" },
  { id: "problem", label: "02" },
  { id: "lifecycle", label: "03" },
  { id: "crm", label: "04" },
  { id: "bidding", label: "05" },
  { id: "finance", label: "06" },
  { id: "cta", label: "07" },
] as const;

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState("01");

  useEffect(() => {
    function onScroll() {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);

      let current = "01";
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= window.innerHeight * 0.4) {
          current = s.label;
        }
      }
      setActive(current);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="pointer-events-none fixed right-4 top-1/2 z-40 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex"
      aria-hidden
    >
      <div className="relative h-40 w-px bg-white/10">
        <div
          className="absolute left-0 top-0 w-px bg-[var(--mk-bronze)] transition-[height] duration-150"
          style={{ height: `${Math.min(100, progress * 100)}%` }}
        />
      </div>
      <span className="font-[family-name:var(--font-marketing-sans)] text-[10px] tracking-[0.2em] text-[var(--mk-muted)]">
        {active}
      </span>
    </div>
  );
}
