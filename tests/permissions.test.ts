import { describe, expect, it } from "vitest";
import {
  hasPermission,
  ROLE_PERMISSIONS,
  PERMISSIONS,
} from "@/config/permissions";

describe("permissions", () => {
  it("gives owners every permission", () => {
    expect(ROLE_PERMISSIONS.OWNER).toHaveLength(PERMISSIONS.length);
    expect(hasPermission(ROLE_PERMISSIONS.OWNER, "BID_ACCEPT")).toBe(true);
  });

  it("hides finance reports from clients and freelancers", () => {
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "REPORT_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "REPORT_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "BID_VIEW")).toBe(false);
  });

  it("lets project managers accept bids", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "BID_ACCEPT")).toBe(
      true,
    );
  });
});
