"use client";

import dynamic from "next/dynamic";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingSections } from "@/components/marketing/sections";
import { MarketingFallback2D } from "@/components/marketing/fallback-2d";
import { CustomCursor } from "@/components/marketing/custom-cursor";
import { ScrollProgress } from "@/components/marketing/scroll-progress";
import { useWebGLSupport } from "@/components/three/webgl-support";

const HeroSceneCanvas = dynamic(
  () =>
    import("@/components/three/hero-scene-canvas").then(
      (m) => m.HeroSceneCanvas,
    ),
  { ssr: false, loading: () => <StudioLoading /> },
);

function StudioLoading() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-5 bg-[#050505]">
      <p className="font-[family-name:var(--font-marketing-display)] text-sm tracking-[0.35em] text-[var(--mk-warm)]">
        TECHNOVA
      </p>
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-[var(--mk-muted)]">
        <span>01</span>
        <span className="h-px w-10 bg-[var(--mk-bronze)]/60" />
        <span>Loading workspace</span>
      </div>
    </div>
  );
}

export function MarketingExperience() {
  const webglOk = useWebGLSupport();

  if (!webglOk) {
    return (
      <div className="marketing-root min-h-dvh">
        <CustomCursor />
        <MarketingNavbar />
        <div className="pt-16">
          <MarketingFallback2D />
        </div>
        <MarketingFooter />
      </div>
    );
  }

  return (
    <div className="marketing-root relative min-h-dvh">
      <CustomCursor />
      <MarketingNavbar />
      <ScrollProgress />

      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 mk-radial-glow" />
        <div className="absolute inset-0 mk-noise" />
        <div className="pointer-events-auto absolute inset-0 h-[55vh] max-h-[420px] sm:h-[min(100dvh,720px)] lg:h-dvh lg:max-h-none">
          <HeroSceneCanvas className="h-full w-full" />
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#050505]/50 via-[#050505]/20 to-[#050505] sm:from-[#050505]/30"
          aria-hidden
        />
      </div>

      <main className="relative z-10 pt-[3.75rem] sm:pt-16">
        <MarketingSections />
      </main>

      <div className="relative z-20">
        <MarketingFooter />
      </div>
    </div>
  );
}
