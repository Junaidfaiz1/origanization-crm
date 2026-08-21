import { describe, expect, it } from "vitest";
import { tenantWhere, assertTenantId } from "@/lib/tenant";

describe("tenant isolation helpers", () => {
  it("always includes organizationId in where clauses", () => {
    const where = tenantWhere("org_1", { status: "OPEN" });
    expect(where).toEqual({ status: "OPEN", organizationId: "org_1" });
  });

  it("does not allow a client-supplied organizationId to replace the session org", () => {
    const where = tenantWhere("session-org", { organizationId: "attacker-org" });
    expect(where.organizationId).toBe("session-org");
  });

  it("rejects cross-tenant record ids", () => {
    expect(assertTenantId("org_a", "org_b")).toBe(false);
    expect(assertTenantId("org_a", "org_a")).toBe(true);
  });
});
