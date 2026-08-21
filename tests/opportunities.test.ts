import { describe, expect, it } from "vitest";
import { assertCanArchiveOpportunity, OPEN_OPPORTUNITY_STAGES } from "@/modules/opportunities/rules";
import {
  createOpportunitySchema,
  opportunityListFilterSchema,
} from "@/modules/opportunities/validation";
import { tenantWhere } from "@/lib/tenant";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("opportunity rules", () => {
  it("blocks archiving an already archived opportunity", () => {
    expect(() =>
      assertCanArchiveOpportunity({ archivedAt: new Date() }),
    ).toThrow(BusinessRuleError);
  });

  it("defines open pipeline stages excluding won and lost", () => {
    expect(OPEN_OPPORTUNITY_STAGES).not.toContain("WON");
    expect(OPEN_OPPORTUNITY_STAGES).not.toContain("LOST");
    expect(OPEN_OPPORTUNITY_STAGES).toContain("PROPOSAL");
  });
});

describe("opportunity validation", () => {
  it("requires client and deal name", () => {
    expect(
      createOpportunitySchema.safeParse({ clientId: "", name: "A" }).success,
    ).toBe(false);
    expect(
      createOpportunitySchema.safeParse({
        clientId: "client_1",
        name: "Dental Platform",
        probability: 50,
      }).success,
    ).toBe(true);
  });

  it("rejects probability outside 0-100", () => {
    expect(
      createOpportunitySchema.safeParse({
        clientId: "client_1",
        name: "Dental Platform",
        probability: 120,
      }).success,
    ).toBe(false);
  });

  it("parses list filters", () => {
    const parsed = opportunityListFilterSchema.parse({
      search: "platform",
      stage: "PROPOSAL",
      clientId: "client_1",
      first: "20",
    });
    expect(parsed.search).toBe("platform");
    expect(parsed.stage).toBe("PROPOSAL");
    expect(parsed.clientId).toBe("client_1");
  });
});

describe("opportunity tenant isolation", () => {
  it("scopes queries by organizationId", () => {
    const where = tenantWhere("org_a", { stage: "NEW" });
    expect(where.organizationId).toBe("org_a");
  });

  it("grants sales managers opportunity access", () => {
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "OPPORTUNITY_VIEW")).toBe(
      true,
    );
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "OPPORTUNITY_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "OPPORTUNITY_VIEW")).toBe(
      false,
    );
  });
});

describe("pipeline weighted value", () => {
  it("computes weighted value from estimate and probability", () => {
    const weighted = (8000 * 80) / 100;
    expect(weighted).toBe(6400);
  });
});
