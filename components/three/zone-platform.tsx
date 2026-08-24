"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Html, Line, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import type { Group } from "three";
import type { ZoneConfig } from "@/components/three/modules-config";
import { useMarketingSceneStore } from "@/lib/ui/marketing-scene-store";

function PlatformBody({
  accent,
  active,
  hovered,
}: {
  accent: string;
  active: boolean;
  hovered: boolean;
}) {
  const intensity = hovered || active ? 0.28 : 0.1;
  return (
    <>
      <RoundedBox args={[1.55, 0.08, 1.1]} radius={0.04} smoothness={4}>
        <meshStandardMaterial
          color="#0f172a"
          metalness={0.65}
          roughness={0.28}
          emissive={accent}
          emissiveIntensity={intensity}
        />
      </RoundedBox>
      <mesh position={[0, 0.055, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.62, 48]} />
        <meshBasicMaterial
          color={accent}
          transparent
          opacity={hovered || active ? 0.55 : 0.25}
        />
      </mesh>
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.08, 0.14, 0.35, 12]} />
        <meshStandardMaterial color="#1e293b" metalness={0.5} roughness={0.4} />
      </mesh>
    </>
  );
}

export function ZonePlatform({
  zone,
  simplified,
}: {
  zone: ZoneConfig;
  simplified?: boolean;
}) {
  const group = useRef<Group>(null);
  const [hovered, setHovered] = useState(false);
  const activeSection = useMarketingSceneStore((s) => s.activeSection);
  const hoveredModule = useMarketingSceneStore((s) => s.hoveredModule);
  const setHoveredModule = useMarketingSceneStore((s) => s.setHoveredModule);
  const reducedMotion = useMarketingSceneStore((s) => s.reducedMotion);

  const active = activeSection === zone.sectionId;
  const dimmed =
    hoveredModule !== null && hoveredModule !== zone.id && !active;

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const base = zone.position;
    const lift = hovered || active ? 0.22 : 0;
    const targetY =
      base[1] +
      lift +
      (reducedMotion ? 0 : Math.sin(t * 0.7 + base[0]) * 0.04);
    group.current.position.y = THREE.MathUtils.lerp(
      group.current.position.y,
      targetY,
      0.08,
    );
    group.current.position.x = base[0];
    group.current.position.z = THREE.MathUtils.lerp(
      group.current.position.z,
      base[2] + (hovered || active ? 0.25 : 0),
      0.1,
    );
    const targetScale = dimmed ? 0.88 : hovered || active ? 1.08 : 1;
    group.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.1,
    );
  });

  return (
    <Float
      speed={reducedMotion ? 0 : 0.9}
      rotationIntensity={reducedMotion ? 0 : 0.08}
      floatIntensity={0}
    >
      <group
        ref={group}
        position={zone.position}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          setHoveredModule(zone.id);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          setHoveredModule(null);
          document.body.style.cursor = "auto";
        }}
        onClick={() => {
          document.getElementById(zone.sectionId)?.scrollIntoView({
            behavior: reducedMotion ? "auto" : "smooth",
            block: "start",
          });
        }}
      >
        <PlatformBody accent={zone.accent} active={active} hovered={hovered} />
        {!simplified ? (
          <mesh position={[0, 0.28, 0]}>
            <boxGeometry args={[0.85, 0.42, 0.04]} />
            <meshStandardMaterial
              color="#020617"
              metalness={0.3}
              roughness={0.35}
              transparent
              opacity={0.9}
              emissive={zone.accent}
              emissiveIntensity={hovered || active ? 0.15 : 0.04}
            />
          </mesh>
        ) : null}
        <Html
          center
          position={[0, simplified ? 0.35 : 0.55, 0]}
          style={{ pointerEvents: "none" }}
          distanceFactor={8}
        >
          <div
            className="select-none text-center transition-transform duration-300"
            style={{
              transform: hovered || active ? "scale(1.12)" : "scale(1)",
              opacity: dimmed ? 0.45 : 1,
            }}
          >
            <p
              className="text-[11px] font-bold uppercase tracking-[0.14em]"
              style={{ color: zone.accent }}
            >
              {zone.title}
            </p>
            {!simplified ? (
              <p className="mt-0.5 text-[9px] text-slate-400">{zone.subtitle}</p>
            ) : null}
          </div>
        </Html>
      </group>
    </Float>
  );
}

export function HubCore({ converge }: { converge?: boolean }) {
  const ref = useRef<Group>(null);
  const reducedMotion = useMarketingSceneStore((s) => s.reducedMotion);

  useFrame((state) => {
    if (!ref.current) return;
    if (!reducedMotion) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
    const s = converge ? 1.25 : 1;
    ref.current.scale.lerp(new THREE.Vector3(s, s, s), 0.06);
  });

  return (
    <group ref={ref} position={[0, 0.05, 0]}>
      <mesh>
        <cylinderGeometry args={[0.62, 0.72, 0.16, 48]} />
        <meshStandardMaterial
          color="#0f766e"
          metalness={0.7}
          roughness={0.22}
          emissive="#0f766e"
          emissiveIntensity={0.4}
        />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <octahedronGeometry args={[0.32, 0]} />
        <meshStandardMaterial
          color="#99f6e4"
          metalness={0.85}
          roughness={0.15}
          emissive="#2dd4bf"
          emissiveIntensity={0.35}
        />
      </mesh>
      <mesh position={[0, 0.18, 0]}>
        <torusGeometry args={[0.95, 0.02, 12, 64]} />
        <meshStandardMaterial
          color="#2dd4bf"
          metalness={0.5}
          roughness={0.25}
          emissive="#2dd4bf"
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.15, 1.35, 64]} />
        <meshBasicMaterial color="#134e4a" transparent opacity={0.4} />
      </mesh>
      <Html center position={[0, -0.55, 0]} style={{ pointerEvents: "none" }}>
        <div className="select-none text-center">
          <p className="text-[10px] font-bold tracking-[0.28em] text-teal-200/95">
            TECHNOVA
          </p>
          <p className="mt-0.5 text-[8px] tracking-[0.18em] text-slate-500">
            BUSINESS HUB
          </p>
        </div>
      </Html>
    </group>
  );
}

export function ConnectionLines({
  zones,
  converge,
}: {
  zones: ZoneConfig[];
  converge?: boolean;
}) {
  const lines = useMemo(
    () =>
      zones.map((z) => ({
        id: z.id,
        points: [
          [0, 0.2, 0] as [number, number, number],
          [
            z.position[0] * (converge ? 0.35 : 1),
            z.position[1] * (converge ? 0.35 : 1) + 0.05,
            z.position[2] * (converge ? 0.35 : 1),
          ] as [number, number, number],
        ],
        color: z.accent,
      })),
    [zones, converge],
  );

  return (
    <>
      {lines.map((line) => (
        <Line
          key={line.id}
          points={line.points}
          color={line.color}
          lineWidth={1}
          transparent
          opacity={converge ? 0.85 : 0.35}
        />
      ))}
    </>
  );
}
