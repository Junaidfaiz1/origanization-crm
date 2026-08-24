"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import { AdaptiveDpr, Preload } from "@react-three/drei";
import { cn } from "@/lib/utils/cn";

const TechNovaWorld = dynamic(
  () =>
    import("@/components/three/technova-world").then((m) => m.TechNovaWorld),
  { ssr: false },
);

export function SceneCanvas({ className }: { className?: string }) {
  return (
    <div className={cn("h-full w-full", className)}>
      <Canvas
        className="h-full w-full touch-none"
        dpr={[1, 1.5]}
        camera={{ position: [0, 1.1, 7.2], fov: 38, near: 0.1, far: 40 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#060a12");
        }}
      >
        <Suspense fallback={null}>
          <TechNovaWorld />
          <AdaptiveDpr pixelated />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
