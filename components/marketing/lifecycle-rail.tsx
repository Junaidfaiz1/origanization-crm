"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LIFECYCLE_STAGES } from "@/lib/marketing/copy";
import { cn } from "@/lib/utils/cn";

/**
 * Continuous infinite marquee of lifecycle cards.
 * Auto-scrolls the rail only (never scrollIntoView / page jump).
 * Scrollbar hidden.
 */
export function LifecycleRail() {
  const [active, setActive] = useState(0);
  const railRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const looping = useRef(false);
  const baseCount = LIFECYCLE_STAGES.length;

  const loopStages = useMemo(
    () => [...LIFECYCLE_STAGES, ...LIFECYCLE_STAGES, ...LIFECYCLE_STAGES],
    [],
  );

  useEffect(() => {
    const node = railRef.current;
    if (!node) return;
    const rail: HTMLDivElement = node;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    requestAnimationFrame(() => {
      const firstMid = rail.children[baseCount] as HTMLElement | undefined;
      if (firstMid) rail.scrollLeft = firstMid.offsetLeft;
    });

    function segmentWidth() {
      const midStart = (rail.children[baseCount] as HTMLElement | undefined)
        ?.offsetLeft;
      const midEnd = (rail.children[baseCount * 2] as HTMLElement | undefined)
        ?.offsetLeft;
      if (midStart == null || midEnd == null) return 0;
      return midEnd - midStart;
    }

    function normalizeLoop() {
      if (looping.current) return;
      const segment = segmentWidth();
      if (segment <= 0) return;
      const midStart = (rail.children[baseCount] as HTMLElement)?.offsetLeft ?? 0;
      const midEnd = (rail.children[baseCount * 2] as HTMLElement)?.offsetLeft ?? 0;

      if (rail.scrollLeft < midStart - 8) {
        looping.current = true;
        rail.scrollLeft += segment;
        looping.current = false;
      } else if (rail.scrollLeft >= midEnd - 8) {
        looping.current = true;
        rail.scrollLeft -= segment;
        looping.current = false;
      }
    }

    function syncActive() {
      const center = rail.scrollLeft + rail.clientWidth / 2;
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      Array.from(rail.children).forEach((child, i) => {
        const el = child as HTMLElement;
        const mid = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(mid - center);
        if (dist < bestDist) {
          bestDist = dist;
          best = i % baseCount;
        }
      });
      setActive(best);
    }

    let raf = 0;
    let last = performance.now();
    const SPEED = 36; // px per second

    function tick(now: number) {
      const dt = Math.min(32, now - last);
      last = now;

      if (!paused.current && !reduced && !document.hidden) {
        rail.scrollLeft += (SPEED * dt) / 1000;
        normalizeLoop();
        syncActive();
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);

    function onEnter() {
      paused.current = true;
    }
    function onLeave() {
      paused.current = false;
    }

    rail.addEventListener("pointerenter", onEnter);
    rail.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      rail.removeEventListener("pointerenter", onEnter);
      rail.removeEventListener("pointerleave", onLeave);
    };
  }, [baseCount]);

  return (
    <div className="mt-12">
      <div
        ref={railRef}
        className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
        role="list"
        aria-label="Business lifecycle stages"
      >
        {loopStages.map((stage, i) => {
          const stageIndex = i % baseCount;
          return (
            <div
              key={`${stage.id}-${i}`}
              role="listitem"
              className={cn(
                "min-w-[10.5rem] shrink-0 rounded-lg border px-4 py-4 text-left",
                stageIndex === active
                  ? "border-[var(--mk-bronze)]/50 bg-[var(--mk-bronze)]/10"
                  : "border-white/10 bg-white/[0.02]",
              )}
            >
              <p className="text-[10px] tracking-[0.2em] text-[var(--mk-muted)]">
                {String(stageIndex + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--mk-text)]">
                {stage.title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-[var(--mk-text-2)]">
                {stage.body}
              </p>
            </div>
          );
        })}
      </div>
      <div className="mt-3 h-px w-full overflow-hidden bg-white/10">
        <div
          className="h-full bg-[var(--mk-bronze)] transition-[width] duration-500"
          style={{ width: `${((active + 1) / baseCount) * 100}%` }}
        />
      </div>
    </div>
  );
}
