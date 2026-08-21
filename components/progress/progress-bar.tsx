import { cn } from "@/lib/utils/cn";

export function ProgressBar({
  value,
  label,
  className,
}: {
  value: number | null | undefined;
  label?: string;
  className?: string;
}) {
  const clamped = Math.min(100, Math.max(0, value ?? 0));
  const display = value == null ? "—" : `${Math.round(clamped)}%`;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between gap-2 text-xs">
        {label ? <span className="text-muted-foreground">{label}</span> : null}
        <span className="tabular-nums font-medium">{display}</span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value == null ? undefined : Math.round(clamped)}
        aria-label={label ?? "Progress"}
      >
        <div
          className="h-full rounded-full bg-foreground/75 transition-[width]"
          style={{ width: `${value == null ? 0 : clamped}%` }}
        />
      </div>
    </div>
  );
}
