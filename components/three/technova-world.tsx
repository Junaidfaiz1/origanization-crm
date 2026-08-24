"use client";

import { UNIVERSE_ZONES } from "@/components/three/modules-config";
import {
  ConnectionLines,
  HubCore,
  ZonePlatform,
} from "@/components/three/zone-platform";
import { SceneEnvironment } from "@/components/three/scene-environment";
import { ScrollCameraController } from "@/components/three/scroll-camera";
import { useMarketingSceneStore } from "@/lib/ui/marketing-scene-store";

export function TechNovaWorld() {
  const isMobile = useMarketingSceneStore((s) => s.isMobile);
  const activeSection = useMarketingSceneStore((s) => s.activeSection);
  const simplified = isMobile;
  const converge = activeSection === "cta" || activeSection === "solution";

  const zones = simplified
    ? UNIVERSE_ZONES.filter((z) =>
        ["crm", "sales", "projects", "bidding", "finance", "clients"].includes(
          z.id,
        ),
      )
    : UNIVERSE_ZONES;

  return (
    <>
      <SceneEnvironment simplified={simplified} />
      <ScrollCameraController />
      <HubCore converge={converge} />
      <ConnectionLines zones={zones} converge={converge} />
      {zones.map((zone) => (
        <ZonePlatform key={zone.id} zone={zone} simplified={simplified} />
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.55, 0]} receiveShadow>
        <circleGeometry args={[6.5, 64]} />
        <meshStandardMaterial
          color="#020617"
          metalness={0.4}
          roughness={0.85}
          transparent
          opacity={0.9}
        />
      </mesh>
    </>
  );
}
