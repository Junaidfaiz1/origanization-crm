import { describe, expect, it } from "vitest";
import {
  FLASH_TOAST_MESSAGES,
  isFlashToastKey,
  withFlashToast,
} from "@/lib/ui/flash-toast";
import {
  createdAtCursorWhere,
  createdAtOrderBy,
  isNewestFirst,
  listSortSchema,
} from "@/lib/ui/list-sort";
import { leadListFilterSchema } from "@/modules/leads/validation";
import { companyListFilterSchema } from "@/modules/companies/validation";
import { contactListFilterSchema } from "@/modules/contacts/validation";
import { clientListFilterSchema } from "@/modules/clients/validation";
import { opportunityListFilterSchema } from "@/modules/opportunities/validation";
import { proposalListFilterSchema } from "@/modules/proposals/validation";
import { projectListFilterSchema } from "@/modules/projects/validation";
import { invoiceListFilterSchema } from "@/modules/invoices/validation";
import { paymentListFilterSchema } from "@/modules/payments/validation";
import { bidRequestListFilterSchema } from "@/modules/bidding/validation";

describe("flash toast helpers", () => {
  it("recognizes known toast keys", () => {
    expect(isFlashToastKey("created")).toBe(true);
    expect(isFlashToastKey("nope")).toBe(false);
    expect(FLASH_TOAST_MESSAGES.created).toContain("Created");
  });

  it("appends toast query params without dropping path segments", () => {
    expect(withFlashToast("/leads/abc", "updated")).toBe("/leads/abc?toast=updated");
    expect(withFlashToast("/leads?q=acme", "archived")).toBe(
      "/leads?q=acme&toast=archived",
    );
  });
});

describe("list sort helpers", () => {
  it("defaults listSortSchema to newest", () => {
    expect(listSortSchema.parse(undefined)).toBe("newest");
    expect(listSortSchema.parse("oldest")).toBe("oldest");
  });

  it("isNewestFirst treats missing as newest", () => {
    expect(isNewestFirst()).toBe(true);
    expect(isNewestFirst("newest")).toBe(true);
    expect(isNewestFirst("oldest")).toBe(false);
  });

  it("builds createdAt orderBy and cursor clauses", () => {
    expect(createdAtOrderBy(true)).toEqual([
      { createdAt: "desc" },
      { id: "desc" },
    ]);
    expect(createdAtOrderBy(false)).toEqual([
      { createdAt: "asc" },
      { id: "asc" },
    ]);

    const decoded = { createdAt: new Date("2024-01-01"), id: "abc" };
    expect(createdAtCursorWhere(decoded, true).OR).toHaveLength(2);
    expect(createdAtCursorWhere(decoded, false).OR).toHaveLength(2);
  });
});

describe("list sort polish", () => {
  const schemas = [
    ["lead", leadListFilterSchema],
    ["company", companyListFilterSchema],
    ["contact", contactListFilterSchema],
    ["client", clientListFilterSchema],
    ["opportunity", opportunityListFilterSchema],
    ["proposal", proposalListFilterSchema],
    ["project", projectListFilterSchema],
    ["invoice", invoiceListFilterSchema],
    ["payment", paymentListFilterSchema],
    ["bidRequest", bidRequestListFilterSchema],
  ] as const;

  it.each(schemas)("defaults %s sort to newest", (_name, schema) => {
    expect(schema.parse({}).sort).toBe("newest");
    expect(schema.parse({ sort: "oldest" }).sort).toBe("oldest");
  });
});
