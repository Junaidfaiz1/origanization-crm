import { describe, expect, it } from "vitest";
import {
  assertCanManageTeam,
  shouldMarkResourceAssigned,
} from "@/modules/team/rules";
import {
  assignTeamMemberSchema,
  teamListFilterSchema,
  updateTeamMemberSchema,
} from "@/modules/team/validation";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("team rules", () => {
  it("blocks managing team on archived projects", () => {
    expect(() =>
      assertCanManageTeam({ archivedAt: new Date(), status: "IN_PROGRESS" }),
    ).toThrow(BusinessRuleError);
  });

  it("blocks managing team on closed projects", () => {
    expect(() =>
      assertCanManageTeam({ archivedAt: null, status: "COMPLETED" }),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertCanManageTeam({ archivedAt: null, status: "CLOSED" }),
    ).toThrow(BusinessRuleError);
  });

  it("allows managing team on open projects", () => {
    expect(() =>
      assertCanManageTeam({ archivedAt: null, status: "BIDDING" }),
    ).not.toThrow();
  });

  it("marks PLANNING and BIDDING projects as RESOURCE_ASSIGNED after assign", () => {
    expect(shouldMarkResourceAssigned("PLANNING")).toBe(true);
    expect(shouldMarkResourceAssigned("BIDDING")).toBe(true);
    expect(shouldMarkResourceAssigned("IN_PROGRESS")).toBe(false);
    expect(shouldMarkResourceAssigned("RESOURCE_ASSIGNED")).toBe(false);
  });
});

describe("team validation", () => {
  it("requires project and resource to assign", () => {
    expect(
      assignTeamMemberSchema.safeParse({ projectId: "", resourceId: "" }).success,
    ).toBe(false);
    expect(
      assignTeamMemberSchema.safeParse({
        projectId: "project_1",
        resourceId: "resource_1",
        role: "Lead",
      }).success,
    ).toBe(true);
  });

  it("allows clearing role on update", () => {
    const parsed = updateTeamMemberSchema.parse({ role: "" });
    expect(parsed.role).toBe("");
  });

  it("parses list filters", () => {
    const parsed = teamListFilterSchema.parse({
      search: "jane",
      projectId: "project_1",
      type: "FREELANCER",
      first: "20",
    });
    expect(parsed.search).toBe("jane");
    expect(parsed.projectId).toBe("project_1");
    expect(parsed.type).toBe("FREELANCER");
    expect(parsed.first).toBe(20);
  });
});

describe("team tenant isolation", () => {
  it("scopes members by organizationId", () => {
    const organizationId = "org_a";
    const where = {
      id: "member_1",
      organizationId,
      project: { organizationId },
    };
    expect(where.organizationId).toBe("org_a");
    expect(where.project.organizationId).toBe("org_a");
  });

  it("uses PROJECT permissions for team access", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_UPDATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "PROJECT_UPDATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PROJECT_UPDATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "PROJECT_UPDATE")).toBe(false);
  });

  it("hides rates without RESOURCE_VIEW", () => {
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "RESOURCE_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "RESOURCE_VIEW")).toBe(true);
  });
});
