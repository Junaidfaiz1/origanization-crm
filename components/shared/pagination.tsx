import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Pagination({
  hasNextPage,
  endCursor,
  currentQuery,
}: {
  hasNextPage: boolean;
  endCursor: string | null;
  currentQuery?: Record<string, string | undefined>;
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
    <div className="flex justify-end pt-4">
      <Button variant="outline" asChild>
        <Link href={`?${params.toString()}`}>Next page</Link>
      </Button>
    </div>
  );
}
