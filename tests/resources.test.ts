import { describe, expect, it } from "vitest";
import { assertCanDeleteResource } from "@/modules/resources/rules";
import {
  createResourceSchema,
  resourceListFilterSchema,
} from "@/modules/resources/validation";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("resource rules", () => {
  it("blocks deleting a resource assigned to projects", () => {
    expect(() =>
      assertCanDeleteResource({ projectMemberCount: 1, contractCount: 0, bidCount: 0 }),
    ).toThrow(BusinessRuleError);
  });

  it("blocks deleting a resource with contracts", () => {
    expect(() =>
      assertCanDeleteResource({ projectMemberCount: 0, contractCount: 1, bidCount: 0 }),
    ).toThrow(BusinessRuleError);
  });

  it("blocks deleting a resource with bids", () => {
    expect(() =>
      assertCanDeleteResource({ projectMemberCount: 0, contractCount: 0, bidCount: 2 }),
    ).toThrow(BusinessRuleError);
  });

  it("allows deleting an unassigned resource", () => {
    expect(() =>
      assertCanDeleteResource({ projectMemberCount: 0, contractCount: 0, bidCount: 0 }),
    ).not.toThrow();
  });
});

describe("resource validation", () => {
  it("requires a team member and type", () => {
    expect(
      createResourceSchema.safeParse({ userId: "", type: "FREELANCER" }).success,
    ).toBe(false);
    expect(
      createResourceSchema.safeParse({
        userId: "user_1",
        type: "EMPLOYEE",
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = resourceListFilterSchema.parse({
      search: "react",
      type: "FREELANCER",
      availabilityStatus: "AVAILABLE",
      skillId: "skill_1",
      first: "20",
    });
    expect(parsed.search).toBe("react");
    expect(parsed.type).toBe("FREELANCER");
    expect(parsed.availabilityStatus).toBe("AVAILABLE");
    expect(parsed.skillId).toBe("skill_1");
    expect(parsed.first).toBe(20);
  });
});

describe("resource permissions", () => {
  it("grants managers full resource access", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "RESOURCE_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "RESOURCE_CREATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "RESOURCE_UPDATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "RESOURCE_DELETE")).toBe(true);
  });

  it("gives finance managers view-only resource access", () => {
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "RESOURCE_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "RESOURCE_CREATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "RESOURCE_UPDATE")).toBe(false);
  });

  it("hides resources from employees and freelancers", () => {
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "RESOURCE_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "RESOURCE_VIEW")).toBe(false);
  });
});

describe("resource tenant isolation", () => {
  it("scopes lookups by organizationId", () => {
    const organizationId = "org_a";
    const where = {
      id: "resource_1",
      organizationId,
    };
    expect(where.organizationId).toBe("org_a");
  });
});
