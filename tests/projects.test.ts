import { describe, expect, it } from "vitest";
import {
  assertCanAddNormalTasks,
  assertCanArchiveProject,
  assertCanEditProject,
  isProjectClosed,
} from "@/modules/projects/rules";
import {
  createProjectSchema,
  projectListFilterSchema,
} from "@/modules/projects/validation";
import { tenantWhere } from "@/lib/tenant";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("project rules", () => {
  it("blocks editing archived projects", () => {
    expect(() => assertCanEditProject({ archivedAt: new Date() })).toThrow(
      BusinessRuleError,
    );
  });

  it("blocks archiving an already archived project", () => {
    expect(() => assertCanArchiveProject({ archivedAt: new Date() })).toThrow(
      BusinessRuleError,
    );
  });

  it("treats completed, closed, and cancelled as closed", () => {
    expect(isProjectClosed("COMPLETED")).toBe(true);
    expect(isProjectClosed("CLOSED")).toBe(true);
    expect(isProjectClosed("CANCELLED")).toBe(true);
    expect(isProjectClosed("IN_PROGRESS")).toBe(false);
  });

  it("blocks new tasks on closed projects", () => {
    expect(() => assertCanAddNormalTasks("COMPLETED")).toThrow(BusinessRuleError);
    expect(() => assertCanAddNormalTasks("IN_PROGRESS")).not.toThrow();
  });
});

describe("project validation", () => {
  it("requires client and name", () => {
    expect(createProjectSchema.safeParse({ clientId: "", name: "" }).success).toBe(false);
    expect(
      createProjectSchema.safeParse({
        clientId: "client_1",
        name: "Website redesign",
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = projectListFilterSchema.parse({
      search: "dental",
      status: "BIDDING",
      clientId: "client_1",
      first: "20",
    });
    expect(parsed.search).toBe("dental");
    expect(parsed.status).toBe("BIDDING");
    expect(parsed.clientId).toBe("client_1");
    expect(parsed.first).toBe(20);
  });
});

describe("project tenant isolation", () => {
  it("scopes queries by organizationId", () => {
    const where = tenantWhere("org_a", { status: "PLANNING" });
    expect(where.organizationId).toBe("org_a");
  });

  it("grants delivery staff project access with role-appropriate mutations", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_CREATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "PROJECT_CREATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PROJECT_CREATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "PROJECT_UPDATE")).toBe(false);
  });
});
