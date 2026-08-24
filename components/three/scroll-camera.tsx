"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { CAMERA_STAGES } from "@/components/three/modules-config";
import { useMarketingSceneStore } from "@/lib/ui/marketing-scene-store";

export function ScrollCameraController() {
  const { camera } = useThree();
  const lookTarget = useRef(new THREE.Vector3(0, 0.2, 0));
  const pointer = useRef({ x: 0, y: 0 });
  const activeSection = useMarketingSceneStore((s) => s.activeSection);
  const reducedMotion = useMarketingSceneStore((s) => s.reducedMotion);

  useFrame((state) => {
    const stage = CAMERA_STAGES[activeSection] ?? CAMERA_STAGES.hero!;
    const targetPos = new THREE.Vector3(...stage.position);
    const desiredLook = new THREE.Vector3(...stage.lookAt);

    if (!reducedMotion) {
      pointer.current.x = THREE.MathUtils.lerp(
        pointer.current.x,
        state.pointer.x * 0.32,
        0.05,
      );
      pointer.current.y = THREE.MathUtils.lerp(
        pointer.current.y,
        state.pointer.y * 0.18,
        0.05,
      );
      targetPos.x += pointer.current.x;
      targetPos.y += pointer.current.y;
    }

    const damp = reducedMotion ? 1 : 0.045;
    camera.position.lerp(targetPos, damp);
    lookTarget.current.lerp(desiredLook, damp);
    camera.lookAt(lookTarget.current);
  });

  return null;
}
