"use client";

import { Suspense, useEffect } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Environment, Preload } from "@react-three/drei";
import { cn } from "@/lib/utils/cn";
import { useMarketingSceneStore } from "@/lib/ui/marketing-scene-store";

const HeroBusinessCore = dynamic(
  () =>
    import("@/components/three/hero-business-core").then(
      (m) => m.HeroBusinessCore,
    ),
  { ssr: false },
);

export function HeroSceneCanvas({ className }: { className?: string }) {
  const setIsMobile = useMarketingSceneStore((s) => s.setIsMobile);
  const setReducedMotion = useMarketingSceneStore((s) => s.setReducedMotion);

  useEffect(() => {
    function sync() {
      setIsMobile(window.innerWidth < 768);
      setReducedMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    }
    sync();
    window.addEventListener("resize", sync);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    mq.addEventListener("change", sync);
    return () => {
      window.removeEventListener("resize", sync);
      mq.removeEventListener("change", sync);
    };
  }, [setIsMobile, setReducedMotion]);

  useEffect(() => {
    function onVisibility() {
      // Pause expensive work when tab hidden — Canvas unmounts via visibility in parent if needed
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div className={cn("h-full w-full", className)}>
      <Canvas
        className="h-full w-full touch-none"
        dpr={[1, 2]}
        camera={{ position: [0, 0.4, 6.2], fov: 36, near: 0.1, far: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#050505", 0);
        }}
      >
        <Suspense fallback={null}>
          <HeroBusinessCore />
          <Environment preset="city" environmentIntensity={0.35} />
          <AdaptiveDpr pixelated />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
