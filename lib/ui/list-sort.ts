import { z } from "zod";

export const LIST_SORT_VALUES = ["newest", "oldest"] as const;
export type ListSort = (typeof LIST_SORT_VALUES)[number];

export const listSortSchema = z
  .enum(LIST_SORT_VALUES)
  .optional()
  .default("newest");

export const DEFAULT_LIST_SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
] as const;

export function isNewestFirst(sort?: string | null): boolean {
  return (sort ?? "newest") !== "oldest";
}

/** Cursor page condition for createdAt + id ordering. */
export function createdAtCursorWhere(
  decoded: { createdAt: Date; id: string },
  newestFirst: boolean,
) {
  return {
    OR: newestFirst
      ? [
          { createdAt: { lt: decoded.createdAt } },
          {
            AND: [{ createdAt: decoded.createdAt }, { id: { lt: decoded.id } }],
          },
        ]
      : [
          { createdAt: { gt: decoded.createdAt } },
          {
            AND: [{ createdAt: decoded.createdAt }, { id: { gt: decoded.id } }],
          },
        ],
  };
}

export function createdAtOrderBy(newestFirst: boolean) {
  return newestFirst
    ? ([{ createdAt: "desc" }, { id: "desc" }] as const)
    : ([{ createdAt: "asc" }, { id: "asc" }] as const);
}

/** Aliases used by domain list services. */
export const createdAtIdCursorClause = createdAtCursorWhere;
export const createdAtIdOrderBy = createdAtOrderBy;
