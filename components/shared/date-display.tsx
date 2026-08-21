type DateDisplayProps = {
  value: Date | string | null | undefined;
};

export function DateDisplay({ value }: DateDisplayProps) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <time dateTime={date.toISOString()}>
      {new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date)}
    </time>
  );
}
