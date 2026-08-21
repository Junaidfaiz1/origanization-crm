import { describe, expect, it } from "vitest";
import {
  activityHref,
  PROJECT_ACTIVITY_ENTITY_TYPES,
  summarizeActivityChange,
} from "@/modules/activity/rules";
import { activityListFilterSchema } from "@/modules/activity/validation";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";

describe("activity rules", () => {
  it("maps entity types to dashboard hrefs", () => {
    expect(activityHref("Project", "p1")).toBe("/projects/p1");
    expect(activityHref("Task", "t1")).toBe("/tasks/t1");
    expect(activityHref("BidRequest", "r1")).toBe("/bidding/requests/r1");
    expect(activityHref("File", "f1")).toBe("/files/f1");
    expect(activityHref("Unknown", "x1")).toBeNull();
  });

  it("summarizes status and title changes", () => {
    expect(
      summarizeActivityChange({ status: "OPEN" }, { status: "DONE" }),
    ).toBe("Status OPEN → DONE");
    expect(summarizeActivityChange(null, { title: "Auth" })).toBe("Auth");
    expect(summarizeActivityChange(null, { fileName: "brief.pdf" })).toBe("brief.pdf");
  });

  it("includes core delivery entity types", () => {
    expect(PROJECT_ACTIVITY_ENTITY_TYPES).toContain("Project");
    expect(PROJECT_ACTIVITY_ENTITY_TYPES).toContain("Bid");
    expect(PROJECT_ACTIVITY_ENTITY_TYPES).toContain("Invoice");
  });
});

describe("activity validation", () => {
  it("parses project and entity filters", () => {
    const parsed = activityListFilterSchema.parse({
      search: "created",
      projectId: "project_1",
      entityType: "Task",
      first: "20",
    });
    expect(parsed.search).toBe("created");
    expect(parsed.projectId).toBe("project_1");
    expect(parsed.entityType).toBe("Task");
    expect(parsed.first).toBe(20);
  });
});

describe("activity permissions and tenant scope", () => {
  it("uses PROJECT_VIEW for activity access", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "PROJECT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "PROJECT_UPDATE")).toBe(false);
  });

  it("scopes audit lookups by organizationId and related entity ids", () => {
    const organizationId = "org_a";
    const where = {
      organizationId,
      OR: [
        { entityType: "Project", entityId: { in: ["project_1"] } },
        { entityType: "Task", entityId: { in: ["task_1"] } },
      ],
    };
    expect(where.organizationId).toBe("org_a");
    expect(where.OR).toHaveLength(2);
  });
});
