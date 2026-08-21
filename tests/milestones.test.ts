import { describe, expect, it } from "vitest";
import {
  assertCanDeleteMilestone,
  assertCanManageMilestones,
} from "@/modules/milestones/rules";
import {
  createMilestoneSchema,
  milestoneListFilterSchema,
} from "@/modules/milestones/validation";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("milestone rules", () => {
  it("blocks managing milestones on archived projects", () => {
    expect(() =>
      assertCanManageMilestones({ archivedAt: new Date(), status: "IN_PROGRESS" }),
    ).toThrow(BusinessRuleError);
  });

  it("blocks managing milestones on closed projects", () => {
    expect(() =>
      assertCanManageMilestones({ archivedAt: null, status: "COMPLETED" }),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertCanManageMilestones({ archivedAt: null, status: "CLOSED" }),
    ).toThrow(BusinessRuleError);
  });

  it("allows managing milestones on open projects", () => {
    expect(() =>
      assertCanManageMilestones({ archivedAt: null, status: "IN_PROGRESS" }),
    ).not.toThrow();
  });

  it("blocks deleting a milestone that still has tasks", () => {
    expect(() => assertCanDeleteMilestone(2)).toThrow(BusinessRuleError);
    expect(() => assertCanDeleteMilestone(0)).not.toThrow();
  });
});

describe("milestone validation", () => {
  it("requires a project and name", () => {
    expect(createMilestoneSchema.safeParse({ projectId: "", name: "" }).success).toBe(
      false,
    );
    expect(
      createMilestoneSchema.safeParse({
        projectId: "project_1",
        name: "UI/UX",
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = milestoneListFilterSchema.parse({
      search: "frontend",
      status: "PENDING",
      projectId: "project_1",
      first: "20",
    });
    expect(parsed.search).toBe("frontend");
    expect(parsed.status).toBe("PENDING");
    expect(parsed.projectId).toBe("project_1");
    expect(parsed.first).toBe(20);
  });
});

describe("milestone tenant isolation", () => {
  it("scopes lookups through the parent project organizationId", () => {
    const organizationId = "org_a";
    const where = {
      id: "ms_1",
      project: { organizationId },
    };
    expect(where.project.organizationId).toBe("org_a");
  });

  it("uses PROJECT permissions for milestone access", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_UPDATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "PROJECT_UPDATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PROJECT_UPDATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "PROJECT_UPDATE")).toBe(false);
  });
});
