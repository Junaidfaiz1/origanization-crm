"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function SearchInput({
  placeholder = "Search",
  param = "q",
}: {
  placeholder?: string;
  param?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();

  return (
    <div className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        defaultValue={params.get(param) ?? ""}
        placeholder={placeholder}
        className="pl-9"
        aria-label={placeholder}
        onKeyDown={(event) => {
          if (event.key !== "Enter") {
            return;
          }
          const next = new URLSearchParams(params.toString());
          const value = event.currentTarget.value.trim();
          if (value) {
            next.set(param, value);
          } else {
            next.delete(param);
          }
          next.delete("cursor");
          router.push(`?${next.toString()}`);
        }}
      />
    </div>
  );
}
