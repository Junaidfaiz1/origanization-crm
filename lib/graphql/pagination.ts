export type PageInfo = {
  hasNextPage: boolean;
  endCursor: string | null;
};

export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}::${id}`, "utf8").toString(
    "base64url",
  );
}

export function decodeCursor(
  cursor: string,
): { createdAt: Date; id: string } | null {
  try {
    const raw = Buffer.from(cursor, "base64url").toString("utf8");
    const [iso, id] = raw.split("::");
    if (!iso || !id) {
      return null;
    }
    const createdAt = new Date(iso);
    if (Number.isNaN(createdAt.getTime())) {
      return null;
    }
    return { createdAt, id };
  } catch {
    return null;
  }
}
