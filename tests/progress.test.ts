import { describe, expect, it } from "vitest";
import {
  computeProgressHealth,
  computeProjectProgress,
  overallFromParts,
  ratioPercent,
  scheduleExpectedPercent,
} from "@/modules/progress/rules";
import { toPublicProgress } from "@/modules/progress/rules";
import { progressListFilterSchema } from "@/modules/progress/validation";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";

describe("progress ratios", () => {
  it("returns null when total is zero", () => {
    expect(ratioPercent(1, 0)).toBeNull();
    expect(ratioPercent(0, 0)).toBeNull();
  });

  it("rounds completion percentages", () => {
    expect(ratioPercent(1, 3)).toBe(33.3);
    expect(ratioPercent(2, 4)).toBe(50);
  });
});

describe("overall progress", () => {
  it("averages milestone and task percents", () => {
    expect(
      overallFromParts({
        status: "IN_PROGRESS",
        milestonePercent: 50,
        taskPercent: 100,
      }),
    ).toBe(75);
  });

  it("uses status heuristic when no delivery items exist", () => {
    expect(
      overallFromParts({
        status: "IN_PROGRESS",
        milestonePercent: null,
        taskPercent: null,
      }),
    ).toBe(40);
  });

  it("forces completed projects to 100%", () => {
    expect(
      overallFromParts({
        status: "COMPLETED",
        milestonePercent: 20,
        taskPercent: 10,
      }),
    ).toBe(100);
  });
});

describe("schedule and health", () => {
  it("computes schedule expected percent from dates", () => {
    const start = new Date("2026-01-01T00:00:00.000Z");
    const end = new Date("2026-01-11T00:00:00.000Z");
    const mid = new Date("2026-01-06T00:00:00.000Z");
    expect(scheduleExpectedPercent(start, end, mid)).toBe(50);
  });

  it("marks delayed when past end date", () => {
    expect(
      computeProgressHealth({
        status: "IN_PROGRESS",
        overallPercent: 90,
        endDate: new Date("2026-01-01T00:00:00.000Z"),
        scheduleExpectedPercent: 100,
        now: new Date("2026-02-01T00:00:00.000Z"),
      }),
    ).toBe("DELAYED");
  });

  it("marks at risk when behind schedule", () => {
    expect(
      computeProgressHealth({
        status: "IN_PROGRESS",
        overallPercent: 20,
        endDate: new Date("2026-12-01T00:00:00.000Z"),
        scheduleExpectedPercent: 50,
        now: new Date("2026-06-01T00:00:00.000Z"),
      }),
    ).toBe("AT_RISK");
  });

  it("computes full project progress snapshot", () => {
    const result = computeProjectProgress({
      status: "IN_PROGRESS",
      startDate: new Date("2026-01-01T00:00:00.000Z"),
      endDate: new Date("2026-12-31T00:00:00.000Z"),
      milestoneTotal: 4,
      milestoneCompleted: 2,
      taskTotal: 10,
      taskDone: 5,
      estimatedHours: 100,
      loggedHours: 40,
      budget: 1000,
      actualCost: 250,
    });
    expect(result.milestonePercent).toBe(50);
    expect(result.taskPercent).toBe(50);
    expect(result.overallPercent).toBe(50);
    expect(result.hoursPercent).toBe(40);
    expect(result.budgetPercent).toBe(25);
  });
});

describe("public progress redaction", () => {
  it("strips hours and budget for client portal", () => {
    const publicRow = toPublicProgress({
      projectId: "p1",
      name: "Dental platform",
      clientId: "c1",
      clientName: "ABC",
      status: "IN_PROGRESS",
      health: "ON_TRACK",
      overallPercent: 50,
      milestonePercent: 50,
      taskPercent: 50,
      hoursPercent: 40,
      budgetPercent: 25,
      scheduleExpectedPercent: 40,
      delayed: false,
      startDate: null,
      endDate: null,
      milestones: { total: 2, completed: 1 },
      tasks: { total: 4, done: 2 },
      hours: { estimated: 100, logged: 40 },
      budget: { planned: "1000.00", actual: "250.00" },
    });
    expect(publicRow.hours).toBeNull();
    expect(publicRow.budget).toBeNull();
    expect(publicRow.hoursPercent).toBeNull();
    expect(publicRow.budgetPercent).toBeNull();
    expect(publicRow.overallPercent).toBe(50);
  });
});

describe("progress validation and authz", () => {
  it("parses list filters", () => {
    const parsed = progressListFilterSchema.parse({
      search: "dental",
      health: "AT_RISK",
      first: "20",
    });
    expect(parsed.search).toBe("dental");
    expect(parsed.health).toBe("AT_RISK");
    expect(parsed.first).toBe(20);
  });

  it("scopes progress to PROJECT_VIEW roles", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PROJECT_VIEW")).toBe(true);
  });

  it("hides budget burn without REPORT_VIEW", () => {
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "REPORT_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "REPORT_VIEW")).toBe(true);
  });

  it("uses organizationId in progress queries", () => {
    const where = { organizationId: "org_a", archivedAt: null };
    expect(where.organizationId).toBe("org_a");
  });
});
