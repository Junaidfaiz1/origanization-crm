import { cn } from "@/lib/utils/cn";

type DataTableColumn<T> = {
  id: string;
  header: string;
  className?: string;
  cell: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  rows: T[];
  columns: DataTableColumn<T>[];
  rowKey: (row: T) => string;
  mobileRow: (row: T) => React.ReactNode;
  caption?: string;
  className?: string;
  minWidthClassName?: string;
};

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  mobileRow,
  caption,
  className,
  minWidthClassName = "min-w-[44rem]",
}: DataTableProps<T>) {
  return (
    <>
      <div
        className={cn(
          "hidden overflow-x-auto rounded-xl border border-border bg-card md:block",
          className,
        )}
      >
        <table className={cn("w-full text-left text-sm", minWidthClassName)}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead className="sticky top-0 z-10 border-b border-border bg-muted/70 text-xs font-medium uppercase tracking-[0.04em] text-muted-foreground backdrop-blur">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.id}
                  scope="col"
                  className={cn("px-4 py-2.5 font-medium", column.className)}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle bg-card">
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="transition-colors hover:bg-muted/50"
              >
                {columns.map((column) => (
                  <td
                    key={column.id}
                    className={cn("px-4 py-3 align-middle", column.className)}
                  >
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2.5 md:hidden" role="list">
        {rows.map((row) => (
          <div key={rowKey(row)} role="listitem">
            {mobileRow(row)}
          </div>
        ))}
      </div>
    </>
  );
}

export function TablePrimaryCell({
  title,
  subtitle,
  href,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  href?: string;
}) {
  const titleNode =
    typeof title === "string" && href ? (
      <a href={href} className="font-medium text-foreground hover:underline">
        {title}
      </a>
    ) : (
      <span className="font-medium text-foreground">{title}</span>
    );

  return (
    <div className="min-w-0">
      <div className="truncate">{titleNode}</div>
      {subtitle ? (
        <div className="mt-0.5 truncate text-caption text-muted-foreground">
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export type { DataTableColumn };
