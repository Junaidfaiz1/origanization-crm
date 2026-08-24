"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Html, RoundedBox } from "@react-three/drei";
import type { Group } from "three";
import { ProductWindowUi } from "@/components/three/product-window-ui";
import type { ModuleConfig } from "@/components/three/modules-config";
import { useMarketingSceneStore } from "@/lib/ui/marketing-scene-store";

type PanelKind = "crm" | "sales" | "projects" | "bidding" | "finance" | "clients";

function kindFromId(id: string): PanelKind {
  if (id === "crm" || id === "sales" || id === "projects" || id === "bidding" || id === "finance" || id === "clients") {
    return id;
  }
  return "crm";
}

export function FloatingPanel({
  module,
  simplified,
}: {
  module: ModuleConfig;
  simplified?: boolean;
}) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const activeSection = useMarketingSceneStore((s) => s.activeSection);
  const setHoveredModule = useMarketingSceneStore((s) => s.setHoveredModule);
  const reducedMotion = useMarketingSceneStore((s) => s.reducedMotion);
  const isMobile = useMarketingSceneStore((s) => s.isMobile);

  const active = activeSection === module.sectionId;
  const position = useMemo(
    (): [number, number, number] =>
      isMobile ? [0, module.mobileY, 0] : module.position,
    [isMobile, module.mobileY, module.position],
  );

  useFrame((state) => {
    if (!group.current || reducedMotion) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = Math.sin(t * 0.35 + module.position[0]) * 0.04;
    const targetZ = hovered || active ? 0.18 : 0;
    group.current.position.z += (position[2] + targetZ - group.current.position.z) * 0.08;
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 1.2}
      rotationIntensity={reducedMotion ? 0 : 0.15}
      floatIntensity={reducedMotion ? 0 : 0.35}
    >
      <group
        ref={group}
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setHoveredModule(module.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          setHoveredModule(null);
          document.body.style.cursor = "auto";
        }}
        onClick={() => {
          document.getElementById(module.sectionId)?.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
            block: "start",
          });
        }}
      >
        <RoundedBox
          args={simplified ? [1.6, 1.05, 0.08] : [1.85, 1.2, 0.08]}
          radius={0.06}
          smoothness={4}
          scale={hovered || active ? 1.05 : 1}
        >
          <meshStandardMaterial
            color="#0f172a"
            metalness={0.2}
            roughness={0.35}
            transparent
            opacity={0.92}
            emissive={module.accent}
            emissiveIntensity={hovered || active ? 0.18 : 0.06}
          />
        </RoundedBox>
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={simplified ? [1.45, 0.9] : [1.7, 1.05]} />
          <meshBasicMaterial color="#020617" transparent opacity={0.35} />
        </mesh>
        {!simplified ? (
          <Html
            transform
            distanceFactor={1.55}
            position={[0, 0, 0.07]}
            style={{ pointerEvents: "none" }}
            occlude={false}
          >
            <ProductWindowUi kind={kindFromId(module.id)} />
          </Html>
        ) : (
          <Html center position={[0, 0, 0.08]} style={{ pointerEvents: "none" }}>
            <div className="rounded-md border border-white/10 bg-slate-950/80 px-3 py-1.5 text-center">
              <p className="text-xs font-semibold text-teal-300">{module.title}</p>
              <p className="text-[10px] text-slate-400">{module.subtitle}</p>
            </div>
          </Html>
        )}
      </group>
    </Float>
  );
}
