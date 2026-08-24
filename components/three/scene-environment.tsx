"use client";

import { useMemo, useRef } from "react";
import { Grid } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useMarketingSceneStore } from "@/lib/ui/marketing-scene-store";

function AmbientDust({ count = 48 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const reducedMotion = useMarketingSceneStore((s) => s.reducedMotion);
  const geometry = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const n1 = Math.sin(i * 12.9898) * 43758.5453;
      const n2 = Math.sin(i * 78.233) * 43758.5453;
      const n3 = Math.sin(i * 39.425) * 43758.5453;
      const r1 = n1 - Math.floor(n1);
      const r2 = n2 - Math.floor(n2);
      const r3 = n3 - Math.floor(n3);
      arr[i * 3] = (r1 - 0.5) * 10;
      arr[i * 3 + 1] = (r2 - 0.5) * 6;
      arr[i * 3 + 2] = (r3 - 0.5) * 6 - 1;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return geo;
  }, [count]);

  useFrame((state) => {
    if (!ref.current || reducedMotion) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.03;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial
        size={0.035}
        color="#5eead4"
        transparent
        opacity={0.45}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

export function SceneEnvironment({ simplified }: { simplified?: boolean }) {
  return (
    <>
      <color attach="background" args={["#060a12"]} />
      <fog attach="fog" args={["#060a12", 7, simplified ? 16 : 22]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[4, 8, 5]}
        intensity={1.15}
        castShadow={!simplified}
        shadow-mapSize={[1024, 1024]}
      />
      <pointLight position={[-3, 2, 2]} intensity={0.65} color="#2dd4bf" />
      <pointLight position={[3, -1, 3]} intensity={0.4} color="#38bdf8" />
      <pointLight position={[0, 3, -2]} intensity={0.25} color="#99f6e4" />
      {!simplified ? <AmbientDust count={56} /> : <AmbientDust count={24} />}
      <Grid
        position={[0, -2.4, 0]}
        args={[20, 20]}
        cellSize={0.55}
        cellThickness={0.5}
        cellColor="#1e293b"
        sectionSize={2.2}
        sectionThickness={1}
        sectionColor="#334155"
        fadeDistance={simplified ? 10 : 16}
        fadeStrength={1.2}
        infiniteGrid
      />
    </>
  );
}
