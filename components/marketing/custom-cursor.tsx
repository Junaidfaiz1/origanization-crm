"use client";

import { useEffect, useSyncExternalStore, useState } from "react";

function subscribeNothing() {
  return () => {};
}

function getCursorCapable(): boolean {
  if (typeof window === "undefined") return false;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return fine && !reduced && window.innerWidth >= 768;
}

export function CustomCursor() {
  const enabled = useSyncExternalStore(
    subscribeNothing,
    getCursorCapable,
    () => false,
  );
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [active, setActive] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    function onMove(e: PointerEvent) {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement | null;
      const interactive = Boolean(
        target?.closest(
          "a, button, [data-cursor='link'], [data-cursor='magnetic'], [data-cursor='panel'], input, textarea, select",
        ),
      );
      setActive(interactive);
    }
    function onEnter() {
      setHidden(false);
    }
    function onLeave() {
      setHidden(true);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseenter", onEnter);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.classList.add("mk-custom-cursor");
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("mk-custom-cursor");
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none fixed z-[100] hidden mix-blend-difference md:block"
        style={{
          left: pos.x,
          top: pos.y,
          opacity: hidden ? 0 : 1,
          transform: `translate(-50%, -50%) scale(${active ? 1.55 : 1})`,
          transition: "transform 180ms ease, opacity 200ms ease",
        }}
      >
        <div
          className="h-10 w-10 rounded-full border border-white/70"
          style={{
            background: active ? "rgb(255 255 255 / 0.08)" : "transparent",
          }}
        />
      </div>
      <div
        aria-hidden
        className="pointer-events-none fixed z-[100] hidden md:block"
        style={{
          left: pos.x,
          top: pos.y,
          opacity: hidden ? 0 : 0.9,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div className="h-1.5 w-1.5 rounded-full bg-[var(--mk-warm)]" />
      </div>
    </>
  );
}
