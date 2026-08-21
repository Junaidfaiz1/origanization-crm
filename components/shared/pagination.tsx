import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({
  hasNextPage,
  endCursor,
  currentQuery,
  label = "Next page",
}: {
  hasNextPage: boolean;
  endCursor: string | null;
  currentQuery?: Record<string, string | undefined>;
  label?: string;
}) {
  if (!hasNextPage || !endCursor) {
    return null;
  }

  const params = new URLSearchParams();
  if (currentQuery) {
    for (const [key, value] of Object.entries(currentQuery)) {
      if (value) {
        params.set(key, value);
      }
    }
  }
  params.set("cursor", endCursor);

  return (
    <nav className="flex justify-end pt-4" aria-label="Pagination">
      <Button variant="outline" asChild className="min-h-11">
        <Link href={`?${params.toString()}`} rel="next">
          {label}
        </Link>
      </Button>
    </nav>
  );
}
