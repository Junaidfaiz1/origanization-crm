export default function ReportsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-40 rounded-md bg-muted" />
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
        <div className="h-20 rounded-xl bg-muted" />
      </div>
      <div className="h-48 rounded-xl bg-muted" />
    </div>
  );
}
