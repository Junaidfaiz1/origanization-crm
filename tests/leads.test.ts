import { describe, expect, it } from "vitest";
import {
  assertCanConvertLead,
  conversionNames,
  isLeadStatus,
} from "@/modules/leads/rules";
import { tenantWhere } from "@/lib/tenant";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";
import { decodeCursor, encodeCursor } from "@/lib/graphql/pagination";

describe("lead conversion rules", () => {
  it("blocks converting twice", () => {
    expect(() =>
      assertCanConvertLead({
        status: "CONVERTED",
        archivedAt: null,
        convertedClientId: "client_1",
      }),
    ).toThrow(BusinessRuleError);

    expect(() =>
      assertCanConvertLead({
        status: "QUALIFIED",
        archivedAt: null,
        convertedClientId: "client_1",
      }),
    ).toThrow(/already been converted/i);
  });

  it("blocks converting archived leads", () => {
    expect(() =>
      assertCanConvertLead({
        status: "QUALIFIED",
        archivedAt: new Date(),
        convertedClientId: null,
      }),
    ).toThrow(/archived/i);
  });

  it("allows converting a qualified open lead", () => {
    expect(() =>
      assertCanConvertLead({
        status: "QUALIFIED",
        archivedAt: null,
        convertedClientId: null,
      }),
    ).not.toThrow();
  });

  it("names company and opportunity from the lead", () => {
    expect(conversionNames({ name: "Sam", companyName: "Riverside Wellness" })).toEqual({
      companyName: "Riverside Wellness",
      opportunityName: "Riverside Wellness — new opportunity",
    });
    expect(conversionNames({ name: "Sam Lee", companyName: null }).companyName).toBe(
      "Sam Lee",
    );
  });
});

describe("lead tenant isolation", () => {
  it("always scopes list queries by session organizationId", () => {
    const where = tenantWhere("org_session", { status: "NEW" });
    expect(where.organizationId).toBe("org_session");
    expect(
      tenantWhere("org_session", { organizationId: "org_attacker" }).organizationId,
    ).toBe("org_session");
  });

  it("hides leads from clients and freelancers", () => {
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "LEAD_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "LEAD_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "LEAD_CREATE")).toBe(true);
  });
});

describe("lead helpers", () => {
  it("accepts only known statuses", () => {
    expect(isLeadStatus("NEW")).toBe(true);
    expect(isLeadStatus("HACKED")).toBe(false);
  });

  it("round-trips pagination cursors", () => {
    const createdAt = new Date("2026-01-15T12:00:00.000Z");
    const cursor = encodeCursor(createdAt, "lead_1");
    expect(decodeCursor(cursor)).toEqual({ createdAt, id: "lead_1" });
    expect(decodeCursor("not-a-cursor")).toBeNull();
  });
});
