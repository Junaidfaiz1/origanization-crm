import { describe, expect, it } from "vitest";
import { assertCanArchiveClient } from "@/modules/clients/rules";
import { createClientSchema, clientListFilterSchema } from "@/modules/clients/validation";
import { tenantWhere } from "@/lib/tenant";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("client rules", () => {
  it("blocks archiving an already archived client", () => {
    expect(() =>
      assertCanArchiveClient({ archivedAt: new Date() }),
    ).toThrow(BusinessRuleError);
  });

  it("allows archiving an active client", () => {
    expect(() =>
      assertCanArchiveClient({ archivedAt: null }),
    ).not.toThrow();
  });
});

describe("client validation", () => {
  it("requires a company", () => {
    expect(createClientSchema.safeParse({ companyId: "" }).success).toBe(false);
    expect(
      createClientSchema.safeParse({
        companyId: "company_1",
        status: "ACTIVE",
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = clientListFilterSchema.parse({
      search: "dental",
      status: "ACTIVE",
      companyId: "company_1",
      first: "20",
    });
    expect(parsed.search).toBe("dental");
    expect(parsed.status).toBe("ACTIVE");
    expect(parsed.companyId).toBe("company_1");
    expect(parsed.first).toBe(20);
  });
});

describe("client tenant isolation", () => {
  it("scopes queries by organizationId", () => {
    const where = tenantWhere("org_a", { status: "ACTIVE" });
    expect(where.organizationId).toBe("org_a");
  });

  it("grants CRM staff client access and hides from portal roles", () => {
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "CLIENT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "CLIENT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "CLIENT_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "CLIENT_VIEW")).toBe(false);
  });
});
