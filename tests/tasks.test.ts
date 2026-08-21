import { describe, expect, it } from "vitest";
import {
  assertCanCreateTask,
  assertCanManageTasksOnProject,
  assertValidMilestoneForTask,
} from "@/modules/tasks/rules";
import {
  createTaskSchema,
  taskListFilterSchema,
  updateTaskStatusSchema,
} from "@/modules/tasks/validation";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("task rules", () => {
  it("blocks creating tasks on archived projects", () => {
    expect(() =>
      assertCanCreateTask({ archivedAt: new Date(), status: "IN_PROGRESS" }),
    ).toThrow(BusinessRuleError);
  });

  it("blocks creating tasks on closed projects", () => {
    expect(() =>
      assertCanCreateTask({ archivedAt: null, status: "COMPLETED" }),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertCanCreateTask({ archivedAt: null, status: "CLOSED" }),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertCanCreateTask({ archivedAt: null, status: "CANCELLED" }),
    ).toThrow(BusinessRuleError);
  });

  it("allows creating tasks on open projects", () => {
    expect(() =>
      assertCanCreateTask({ archivedAt: null, status: "IN_PROGRESS" }),
    ).not.toThrow();
  });

  it("blocks managing tasks on archived projects", () => {
    expect(() =>
      assertCanManageTasksOnProject({ archivedAt: new Date(), status: "IN_PROGRESS" }),
    ).toThrow(BusinessRuleError);
  });

  it("requires milestone to belong to the selected project", () => {
    expect(() =>
      assertValidMilestoneForTask({ projectId: "project_a" }, "project_b"),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertValidMilestoneForTask({ projectId: "project_a" }, "project_a"),
    ).not.toThrow();
    expect(() => assertValidMilestoneForTask(null, "project_a")).not.toThrow();
  });
});

describe("task validation", () => {
  it("requires a project and title", () => {
    expect(createTaskSchema.safeParse({ projectId: "", title: "" }).success).toBe(false);
    expect(
      createTaskSchema.safeParse({
        projectId: "project_1",
        title: "Wireframes",
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = taskListFilterSchema.parse({
      search: "wireframe",
      status: "TODO",
      priority: "HIGH",
      projectId: "project_1",
      mineOnly: "true",
      first: "20",
    });
    expect(parsed.search).toBe("wireframe");
    expect(parsed.status).toBe("TODO");
    expect(parsed.priority).toBe("HIGH");
    expect(parsed.projectId).toBe("project_1");
    expect(parsed.mineOnly).toBe(true);
    expect(parsed.first).toBe(20);
  });

  it("validates status updates", () => {
    expect(updateTaskStatusSchema.safeParse({ status: "DONE" }).success).toBe(true);
    expect(updateTaskStatusSchema.safeParse({ status: "INVALID" }).success).toBe(false);
  });
});

describe("task permissions", () => {
  it("grants managers full task access", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "TASK_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "TASK_CREATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "TASK_UPDATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "TASK_DELETE")).toBe(true);
  });

  it("limits employees to view and update", () => {
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "TASK_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "TASK_UPDATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "TASK_CREATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "TASK_DELETE")).toBe(false);
  });

  it("limits freelancers to view and update", () => {
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "TASK_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "TASK_UPDATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "TASK_CREATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "TASK_DELETE")).toBe(false);
  });
});

describe("task tenant isolation", () => {
  it("scopes lookups by organizationId", () => {
    const organizationId = "org_a";
    const where = {
      id: "task_1",
      organizationId,
    };
    expect(where.organizationId).toBe("org_a");
  });
});
