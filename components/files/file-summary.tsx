function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileSummaryCards({
  summary,
}: {
  summary: { total: number; totalBytes: number; projectCount: number };
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Files</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">{summary.total}</p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Storage used</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">
          {formatBytes(summary.totalBytes)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">On projects</p>
        <p className="mt-1 text-xl font-semibold tracking-tight">{summary.projectCount}</p>
      </div>
    </div>
  );
}
