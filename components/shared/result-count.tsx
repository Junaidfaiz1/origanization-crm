export function ResultCount({
  count,
  label,
}: {
  count: number;
  label: string;
}) {
  return (
    <p className="text-sm text-muted-foreground" aria-live="polite">
      {count} {label}
    </p>
  );
}
