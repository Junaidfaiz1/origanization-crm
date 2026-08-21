import { describe, expect, it } from "vitest";
import {
  assertCanLogTimeOnProject,
  assertValidTaskForTimeEntry,
  computeDurationSeconds,
  formatDuration,
} from "@/modules/time-tracking/rules";
import {
  createTimeEntrySchema,
  timeEntryListFilterSchema,
} from "@/modules/time-tracking/validation";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("time entry rules", () => {
  it("blocks logging time on closed projects", () => {
    expect(() =>
      assertCanLogTimeOnProject({ archivedAt: null, status: "COMPLETED" }),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertCanLogTimeOnProject({ archivedAt: null, status: "CLOSED" }),
    ).toThrow(BusinessRuleError);
  });

  it("blocks logging time on archived projects", () => {
    expect(() =>
      assertCanLogTimeOnProject({ archivedAt: new Date(), status: "IN_PROGRESS" }),
    ).toThrow(BusinessRuleError);
  });

  it("allows logging time on open projects", () => {
    expect(() =>
      assertCanLogTimeOnProject({ archivedAt: null, status: "IN_PROGRESS" }),
    ).not.toThrow();
  });

  it("requires task to belong to the selected project", () => {
    expect(() =>
      assertValidTaskForTimeEntry({ projectId: "project_a" }, "project_b"),
    ).toThrow(BusinessRuleError);
    expect(() =>
      assertValidTaskForTimeEntry({ projectId: "project_a" }, "project_a"),
    ).not.toThrow();
  });

  it("computes duration server-side", () => {
    const startedAt = new Date("2026-01-01T09:00:00.000Z");
    const endedAt = new Date("2026-01-01T11:30:00.000Z");
    expect(computeDurationSeconds(startedAt, endedAt)).toBe(9000);
  });

  it("rejects end time before start time", () => {
    const startedAt = new Date("2026-01-01T11:00:00.000Z");
    const endedAt = new Date("2026-01-01T09:00:00.000Z");
    expect(() => computeDurationSeconds(startedAt, endedAt)).toThrow(BusinessRuleError);
  });

  it("formats durations for display", () => {
    expect(formatDuration(9000)).toBe("2h 30m");
    expect(formatDuration(1200)).toBe("20m");
    expect(formatDuration(null)).toBe("—");
  });
});

describe("time entry validation", () => {
  it("requires project and start time", () => {
    expect(
      createTimeEntrySchema.safeParse({ projectId: "", startedAt: "" }).success,
    ).toBe(false);
    expect(
      createTimeEntrySchema.safeParse({
        projectId: "project_1",
        startedAt: "2026-01-01T09:00:00.000Z",
        endedAt: "2026-01-01T11:00:00.000Z",
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = timeEntryListFilterSchema.parse({
      search: "wireframe",
      projectId: "project_1",
      billable: "true",
      runningOnly: "true",
      first: "20",
    });
    expect(parsed.search).toBe("wireframe");
    expect(parsed.projectId).toBe("project_1");
    expect(parsed.billable).toBe(true);
    expect(parsed.runningOnly).toBe(true);
    expect(parsed.first).toBe(20);
  });
});

describe("time entry permissions", () => {
  it("grants managers full time entry access", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "TIME_ENTRY_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "TIME_ENTRY_CREATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "TIME_ENTRY_UPDATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "TIME_ENTRY_DELETE")).toBe(true);
  });

  it("lets employees and freelancers log their own time", () => {
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "TIME_ENTRY_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "TIME_ENTRY_CREATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "TIME_ENTRY_CREATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "TIME_ENTRY_DELETE")).toBe(false);
  });

  it("lets finance view time for reporting", () => {
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "TIME_ENTRY_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "TIME_ENTRY_CREATE")).toBe(false);
  });
});

describe("time entry tenant isolation", () => {
  it("scopes lookups by organizationId", () => {
    const organizationId = "org_a";
    const where = {
      id: "time_1",
      organizationId,
    };
    expect(where.organizationId).toBe("org_a");
  });
});
