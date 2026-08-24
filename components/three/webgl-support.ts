"use client";

import { useSyncExternalStore } from "react";

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

function subscribe() {
  return () => undefined;
}

export function useWebGLSupport() {
  return useSyncExternalStore(subscribe, supportsWebGL, () => true);
}
