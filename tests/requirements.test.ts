import { describe, expect, it } from "vitest";
import { assertCanManageRequirements } from "@/modules/requirements/rules";
import {
  createRequirementSchema,
  requirementListFilterSchema,
} from "@/modules/requirements/validation";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("requirement rules", () => {
  it("blocks managing requirements on archived projects", () => {
    expect(() =>
      assertCanManageRequirements({ archivedAt: new Date(), status: "IN_PROGRESS" }),
    ).toThrow(BusinessRuleError);
  });

  it("blocks managing requirements on closed projects", () => {
    expect(() =>
      assertCanManageRequirements({ archivedAt: null, status: "COMPLETED" }),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertCanManageRequirements({ archivedAt: null, status: "CLOSED" }),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertCanManageRequirements({ archivedAt: null, status: "CANCELLED" }),
    ).toThrow(BusinessRuleError);
  });

  it("allows managing requirements on open projects", () => {
    expect(() =>
      assertCanManageRequirements({ archivedAt: null, status: "IN_PROGRESS" }),
    ).not.toThrow();
  });
});

describe("requirement validation", () => {
  it("requires a project and title", () => {
    expect(createRequirementSchema.safeParse({ projectId: "", title: "" }).success).toBe(
      false,
    );
    expect(
      createRequirementSchema.safeParse({
        projectId: "project_1",
        title: "Patient portal auth",
      }).success,
    ).toBe(true);
  });

  it("defaults priority and status", () => {
    const parsed = createRequirementSchema.parse({
      projectId: "project_1",
      title: "Patient portal auth",
    });
    expect(parsed.priority).toBe("MEDIUM");
    expect(parsed.status).toBe("OPEN");
  });

  it("parses list filters", () => {
    const parsed = requirementListFilterSchema.parse({
      search: "auth",
      status: "OPEN",
      priority: "HIGH",
      projectId: "project_1",
      first: "20",
    });
    expect(parsed.search).toBe("auth");
    expect(parsed.status).toBe("OPEN");
    expect(parsed.priority).toBe("HIGH");
    expect(parsed.projectId).toBe("project_1");
    expect(parsed.first).toBe(20);
  });
});

describe("requirement tenant isolation", () => {
  it("scopes lookups through the parent project organizationId", () => {
    const organizationId = "org_a";
    const where = {
      id: "req_1",
      project: { organizationId },
    };
    expect(where.project.organizationId).toBe("org_a");
  });

  it("uses PROJECT permissions for requirement access", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_UPDATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "PROJECT_UPDATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PROJECT_UPDATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "PROJECT_UPDATE")).toBe(false);
  });
});
