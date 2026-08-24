"use client";

import { useEffect } from "react";
import { useMarketingSceneStore } from "@/lib/ui/marketing-scene-store";

const SECTION_IDS = [
  "hero",
  "problem",
  "solution",
  "workflow",
  "crm",
  "sales",
  "proposals",
  "projects",
  "bidding",
  "resources",
  "time",
  "finance",
  "profit",
  "client-portal",
  "freelancer-portal",
  "roles",
  "dashboard",
  "beforeafter",
  "usecases",
  "faq",
  "cta",
] as const;

export function useMarketingScrollSync() {
  const setActiveSection = useMarketingSceneStore((s) => s.setActiveSection);
  const setScrollProgress = useMarketingSceneStore((s) => s.setScrollProgress);
  const setReducedMotion = useMarketingSceneStore((s) => s.setReducedMotion);
  const setIsMobile = useMarketingSceneStore((s) => s.setIsMobile);

  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqMobile = window.matchMedia("(max-width: 1023px)");
    const syncPrefs = () => {
      setReducedMotion(mqMotion.matches);
      setIsMobile(mqMobile.matches);
    };
    syncPrefs();
    mqMotion.addEventListener("change", syncPrefs);
    mqMobile.addEventListener("change", syncPrefs);
    return () => {
      mqMotion.removeEventListener("change", syncPrefs);
      mqMobile.removeEventListener("change", syncPrefs);
    };
  }, [setIsMobile, setReducedMotion]);

  useEffect(() => {
    const elements = SECTION_IDS.map((id) =>
      document.getElementById(id),
    ).filter(Boolean) as HTMLElement[];

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveSection(visible.target.id);
        }
      },
      { threshold: [0.15, 0.35, 0.55], rootMargin: "-10% 0px -35% 0px" },
    );

    for (const el of elements) observer.observe(el);

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [setActiveSection, setScrollProgress]);
}
