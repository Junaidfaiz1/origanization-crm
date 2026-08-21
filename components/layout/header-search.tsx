"use client";

import { useEffect, useId, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  searchWorkspaceAction,
  type SearchHit,
} from "@/modules/search/actions";
import { cn } from "@/lib/utils/cn";

export function HeaderSearch() {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [pending, startTransition] = useTransition();
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setSearched(false);
      setActiveIndex(-1);
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const results = await searchWorkspaceAction(trimmed);
        setHits(results);
        setSearched(true);
        setActiveIndex(results.length > 0 ? 0 : -1);
        setOpen(true);
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function goTo(href: string) {
    setOpen(false);
    setQuery("");
    setHits([]);
    router.push(href);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (!open && (event.key === "ArrowDown" || event.key === "Enter")) {
      if (query.trim().length >= 2) {
        setOpen(true);
      }
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (hits.length === 0) return;
      setActiveIndex((index) => (index + 1) % hits.length);
      setOpen(true);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (hits.length === 0) return;
      setActiveIndex((index) => (index <= 0 ? hits.length - 1 : index - 1));
      setOpen(true);
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const hit = activeIndex >= 0 ? hits[activeIndex] : hits[0];
      if (hit) {
        goTo(hit.href);
      }
    }
  }

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={rootRef} className="relative min-w-0 w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      {pending ? (
        <Loader2 className="pointer-events-none absolute right-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
      ) : null}
      <Input
        ref={inputRef}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          if (query.trim().length >= 2) {
            setOpen(true);
          }
        }}
        onKeyDown={onKeyDown}
        placeholder="Search workspace…"
        className="h-9 min-w-0 pl-9 pr-9"
        aria-label="Search leads, clients, projects, and more"
        aria-autocomplete="list"
        aria-controls={listId}
        aria-expanded={showPanel}
        role="combobox"
        autoComplete="off"
      />

      {showPanel ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-50 max-h-80 overflow-y-auto rounded-xl border border-border bg-card shadow-lg"
        >
          {pending && hits.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">Searching…</p>
          ) : null}

          {!pending && searched && hits.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              No matches for “{query.trim()}”.
            </p>
          ) : null}

          {hits.map((hit, index) => (
            <Link
              key={`${hit.type}-${hit.id}`}
              href={hit.href}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "flex flex-col gap-0.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
                index === activeIndex && "bg-muted/60",
              )}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                setOpen(false);
                setQuery("");
                setHits([]);
              }}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium">{hit.title}</span>
                <span className="shrink-0 text-[11px] uppercase tracking-wide text-muted-foreground">
                  {hit.type}
                </span>
              </span>
              {hit.subtitle ? (
                <span className="truncate text-xs text-muted-foreground">
                  {hit.subtitle}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
