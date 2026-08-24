"use client";

import { create } from "zustand";

type MarketingSceneState = {
  activeSection: string;
  scrollProgress: number;
  hoveredModule: string | null;
  reducedMotion: boolean;
  isMobile: boolean;
  setActiveSection: (section: string) => void;
  setScrollProgress: (value: number) => void;
  setHoveredModule: (id: string | null) => void;
  setReducedMotion: (value: boolean) => void;
  setIsMobile: (value: boolean) => void;
};

export const useMarketingSceneStore = create<MarketingSceneState>((set) => ({
  activeSection: "hero",
  scrollProgress: 0,
  hoveredModule: null,
  reducedMotion: false,
  isMobile: false,
  setActiveSection: (activeSection) => set({ activeSection }),
  setScrollProgress: (scrollProgress) => set({ scrollProgress }),
  setHoveredModule: (hoveredModule) => set({ hoveredModule }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setIsMobile: (isMobile) => set({ isMobile }),
}));
