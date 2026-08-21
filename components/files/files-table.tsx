import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { SerializedFile } from "@/modules/files/service";

function formatBytes(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

const columns: DataTableColumn<SerializedFile>[] = [
  {
    id: "file",
    header: "File",
    cell: (file) => (
      <>
        <Link href={`/files/${file.id}`} className="font-medium hover:underline">
          {file.fileName}
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">{file.mimeType}</p>
      </>
    ),
  },
  {
    id: "entity",
    header: "Attached to",
    className: "text-muted-foreground",
    cell: (file) => (
      <>
        {file.entityType}
        {file.entityType === "Project" ? (
          <>
            {" · "}
            <Link
              href={`/projects/${file.entityId}`}
              className="hover:text-foreground hover:underline"
            >
              Open
            </Link>
          </>
        ) : null}
      </>
    ),
  },
  {
    id: "size",
    header: "Size",
    className: "text-muted-foreground",
    cell: (file) => formatBytes(file.size),
  },
  {
    id: "uploader",
    header: "Uploaded by",
    className: "text-muted-foreground",
    cell: (file) => file.uploadedBy.name,
  },
  {
    id: "uploaded",
    header: "Uploaded",
    className: "text-muted-foreground",
    cell: (file) => <DateDisplay value={file.createdAt} />,
  },
];

export function FilesTable({ files }: { files: SerializedFile[] }) {
  return (
    <DataTable
      rows={files}
      columns={columns}
      rowKey={(file) => file.id}
      caption="Files"
      minWidthClassName="min-w-[48rem]"
      mobileRow={(file) => (
        <Link
          href={`/files/${file.id}`}
          className="block rounded-xl border border-border bg-card p-4"
        >
          <p className="truncate font-medium">{file.fileName}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {file.entityType} · {formatBytes(file.size)}
          </p>
        </Link>
      )}
    />
  );
}
