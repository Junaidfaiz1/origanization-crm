import { describe, expect, it } from "vitest";
import { assertCanArchiveContact } from "@/modules/contacts/rules";
import { createContactSchema, contactListFilterSchema } from "@/modules/contacts/validation";
import { tenantWhere } from "@/lib/tenant";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("contact rules", () => {
  it("blocks archiving an already archived contact", () => {
    expect(() =>
      assertCanArchiveContact({ archivedAt: new Date() }),
    ).toThrow(BusinessRuleError);
  });

  it("blocks archiving a primary client contact", () => {
    expect(() =>
      assertCanArchiveContact({ archivedAt: null, _count: { primaryFor: 1 } }),
    ).toThrow(BusinessRuleError);
  });

  it("allows archiving a contact with no active primary clients", () => {
    expect(() =>
      assertCanArchiveContact({ archivedAt: null, _count: { primaryFor: 0 } }),
    ).not.toThrow();
  });
});

describe("contact validation", () => {
  it("requires name and company", () => {
    expect(createContactSchema.safeParse({ name: "A", companyId: "" }).success).toBe(
      false,
    );
    expect(
      createContactSchema.safeParse({
        name: "Priya Nair",
        companyId: "company_1",
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = contactListFilterSchema.parse({
      search: "director",
      companyId: "company_1",
      first: "20",
    });
    expect(parsed.search).toBe("director");
    expect(parsed.companyId).toBe("company_1");
    expect(parsed.first).toBe(20);
  });
});

describe("contact tenant isolation", () => {
  it("scopes queries by organizationId", () => {
    const where = tenantWhere("org_a", { companyId: "company_1" });
    expect(where.organizationId).toBe("org_a");
  });

  it("uses company permissions for CRM staff and hides from portals", () => {
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "COMPANY_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "COMPANY_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "COMPANY_CREATE")).toBe(
      true,
    );
  });
});
