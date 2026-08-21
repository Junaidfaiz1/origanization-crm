import { describe, expect, it } from "vitest";
import { assertCanArchiveCompany } from "@/modules/companies/rules";
import { createCompanySchema, companyListFilterSchema } from "@/modules/companies/validation";
import { tenantWhere } from "@/lib/tenant";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("company rules", () => {
  it("blocks archiving an already archived company", () => {
    expect(() =>
      assertCanArchiveCompany({ archivedAt: new Date() }),
    ).toThrow(BusinessRuleError);
  });

  it("allows archiving an active company", () => {
    expect(() =>
      assertCanArchiveCompany({ archivedAt: null }),
    ).not.toThrow();
  });
});

describe("company validation", () => {
  it("requires a company name", () => {
    expect(createCompanySchema.safeParse({ name: "A" }).success).toBe(false);
    expect(
      createCompanySchema.safeParse({ name: "Riverside Wellness" }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = companyListFilterSchema.parse({
      search: "dental",
      industry: "Healthcare",
      first: "20",
    });
    expect(parsed.search).toBe("dental");
    expect(parsed.industry).toBe("Healthcare");
    expect(parsed.first).toBe(20);
  });
});

describe("company tenant isolation", () => {
  it("scopes queries by organizationId", () => {
    const where = tenantWhere("org_a", { name: "ABC Dental" });
    expect(where.organizationId).toBe("org_a");
  });

  it("hides companies from clients and freelancers", () => {
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "COMPANY_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "COMPANY_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "COMPANY_CREATE")).toBe(
      true,
    );
  });
});
