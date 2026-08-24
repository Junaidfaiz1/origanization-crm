"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Text } from "@react-three/drei";
import * as THREE from "three";
import { useMarketingSceneStore } from "@/lib/ui/marketing-scene-store";

const NODES = [
  { label: "LEAD", angle: 0 },
  { label: "OPPORTUNITY", angle: Math.PI / 3 },
  { label: "PROPOSAL", angle: (2 * Math.PI) / 3 },
  { label: "PROJECT", angle: Math.PI },
  { label: "INVOICE", angle: (4 * Math.PI) / 3 },
  { label: "PROFIT", angle: (5 * Math.PI) / 3 },
] as const;

function BusinessCore({ scrollInfluence }: { scrollInfluence: number }) {
  const mesh = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pointer = state.pointer;
    if (mesh.current) {
      mesh.current.rotation.y = t * 0.15 + pointer.x * 0.2;
      mesh.current.rotation.x = 0.35 + pointer.y * 0.12 + scrollInfluence * 0.4;
      mesh.current.position.y = Math.sin(t * 0.6) * 0.08;
    }
    if (ring.current) {
      ring.current.rotation.z = t * 0.08;
      ring.current.rotation.x = Math.PI / 2.4 + scrollInfluence * 0.3;
    }
  });

  return (
    <group>
      <mesh ref={mesh} castShadow>
        <torusKnotGeometry args={[0.72, 0.22, 180, 28]} />
        <meshStandardMaterial
          color="#c68a52"
          metalness={0.92}
          roughness={0.22}
          envMapIntensity={1.2}
        />
      </mesh>
      <mesh ref={ring} scale={1.55}>
        <torusGeometry args={[1.35, 0.02, 16, 96]} />
        <meshStandardMaterial
          color="#8cb4d8"
          metalness={0.8}
          roughness={0.35}
          transparent
          opacity={0.55}
        />
      </mesh>
      <mesh scale={0.55}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial
          color="#151515"
          metalness={0.7}
          roughness={0.4}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}

function OrbitNode({
  label,
  angle,
  radius,
  reduced,
}: {
  label: string;
  angle: number;
  radius: number;
  reduced: boolean;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (reduced || !group.current) return;
    const t = state.clock.elapsedTime * 0.12;
    const a = angle + t;
    group.current.position.set(
      Math.cos(a) * radius,
      Math.sin(a * 0.9) * 0.35,
      Math.sin(a) * radius * 0.55,
    );
  });

  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius * 0.55;

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.35}>
      <group ref={group} position={[x, 0, z]}>
        <mesh>
          <boxGeometry args={[0.55, 0.32, 0.04]} />
          <meshStandardMaterial
            color="#151515"
            metalness={0.55}
            roughness={0.4}
            transparent
            opacity={0.92}
          />
        </mesh>
        <mesh position={[0, 0, 0.03]}>
          <planeGeometry args={[0.48, 0.24]} />
          <meshBasicMaterial color="#101010" transparent opacity={0.9} />
        </mesh>
        <Text
          position={[0, 0, 0.05]}
          fontSize={0.07}
          color="#e8b27b"
          anchorX="center"
          anchorY="middle"
          maxWidth={0.5}
        >
          {label}
        </Text>
      </group>
    </Float>
  );
}

function Particles({ count = 80 }: { count?: number }) {
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    // Deterministic pseudo-random positions (no Math.random in render)
    let seed = count * 9973 + 42;
    const next = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (next() - 0.5) * 10;
      arr[i * 3 + 1] = (next() - 0.5) * 6;
      arr[i * 3 + 2] = (next() - 0.5) * 8;
    }
    return arr;
  }, [count]);

  useFrame((state) => {
    if (!points.current) return;
    points.current.rotation.y = state.clock.elapsedTime * 0.02;
    const scroll = useMarketingSceneStore.getState().scrollProgress;
    points.current.position.y = -scroll * 0.8;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.025}
        color="#e8b27b"
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

export function HeroBusinessCore() {
  const isMobile = useMarketingSceneStore((s) => s.isMobile);
  const reducedMotion = useMarketingSceneStore((s) => s.reducedMotion);
  const scrollProgress = useMarketingSceneStore((s) => s.scrollProgress);
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current || reducedMotion) return;
    group.current.rotation.y = state.pointer.x * 0.15;
    group.current.rotation.x = state.pointer.y * 0.08;
    group.current.position.y = -scrollProgress * 1.2;
    group.current.position.z = scrollProgress * 0.6;
    group.current.scale.setScalar(1 - Math.min(0.25, scrollProgress * 0.35));
  });

  return (
    <group ref={group}>
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[4, 6, 3]}
        intensity={1.15}
        color="#f5f1ea"
        castShadow
      />
      <pointLight position={[-3, 2, 2]} intensity={0.55} color="#c68a52" />
      <pointLight position={[3, -1, -2]} intensity={0.4} color="#8cb4d8" />
      <BusinessCore scrollInfluence={scrollProgress} />
      {!isMobile &&
        NODES.map((n) => (
          <OrbitNode
            key={n.label}
            label={n.label}
            angle={n.angle}
            radius={isMobile ? 2.1 : 2.55}
            reduced={reducedMotion}
          />
        ))}
      {!isMobile && !reducedMotion ? (
        <Particles count={isMobile ? 40 : 90} />
      ) : null}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
        <circleGeometry args={[3.2, 64]} />
        <meshStandardMaterial
          color="#050505"
          metalness={0.3}
          roughness={0.9}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  );
}
