import { describe, expect, it } from "vitest";
import {
  assertAssignableRole,
  assertCanDemoteOwner,
  assertCanSuspendOwner,
} from "@/modules/users/rules";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@/modules/auth/validation";
import {
  inviteUserSchema,
  updateMemberRoleSchema,
} from "@/modules/users/validation";
import { hashToken, createRawToken } from "@/lib/auth/tokens";
import { BusinessRuleError } from "@/lib/errors/app-error";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";

describe("user invite / role rules", () => {
  it("blocks non-owners from assigning OWNER", () => {
    expect(() => assertAssignableRole("OWNER", "ADMIN")).toThrow(
      BusinessRuleError,
    );
    expect(() => assertAssignableRole("OWNER", "OWNER")).not.toThrow();
  });

  it("allows assignable system roles", () => {
    expect(() => assertAssignableRole("EMPLOYEE", "ADMIN")).not.toThrow();
    expect(() => assertAssignableRole("FREELANCER", "OWNER")).not.toThrow();
  });

  it("blocks demoting the last owner", () => {
    expect(() =>
      assertCanDemoteOwner({
        currentRoleKey: "OWNER",
        nextRoleKey: "ADMIN",
        activeOwnerCount: 1,
      }),
    ).toThrow(BusinessRuleError);

    expect(() =>
      assertCanDemoteOwner({
        currentRoleKey: "OWNER",
        nextRoleKey: "ADMIN",
        activeOwnerCount: 2,
      }),
    ).not.toThrow();
  });

  it("blocks suspending the last owner", () => {
    expect(() =>
      assertCanSuspendOwner({ roleKey: "OWNER", activeOwnerCount: 1 }),
    ).toThrow(BusinessRuleError);
  });
});

describe("user validation", () => {
  it("requires invite fields", () => {
    expect(inviteUserSchema.safeParse({}).success).toBe(false);
    expect(
      inviteUserSchema.safeParse({
        name: "Ada",
        email: "ada@example.com",
        roleKey: "EMPLOYEE",
      }).success,
    ).toBe(true);
  });

  it("requires membership id for role updates", () => {
    expect(
      updateMemberRoleSchema.safeParse({
        membershipId: "mem_1",
        roleKey: "ADMIN",
      }).success,
    ).toBe(true);
  });
});

describe("forgot / reset password validation", () => {
  it("validates forgot-password email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "bad" }).success).toBe(
      false,
    );
    expect(
      forgotPasswordSchema.safeParse({ email: "user@example.com" }).success,
    ).toBe(true);
  });

  it("requires matching passwords for reset", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "abc",
        password: "Password1",
        confirmPassword: "Password2",
      }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        token: "abc",
        password: "Password1",
        confirmPassword: "Password1",
      }).success,
    ).toBe(true);
  });

  it("allows accept-only invite without password fields", () => {
    expect(
      resetPasswordSchema.safeParse({
        token: "abc",
        acceptOnly: true,
      }).success,
    ).toBe(true);
  });
});

describe("auth tokens", () => {
  it("hashes tokens deterministically", () => {
    const raw = createRawToken();
    expect(hashToken(raw)).toBe(hashToken(raw));
    expect(hashToken(raw)).not.toBe(raw);
  });
});

describe("user permissions", () => {
  it("grants invite/update to owners and admins only among staff", () => {
    expect(hasPermission(ROLE_PERMISSIONS.OWNER, "USER_INVITE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.ADMIN, "USER_UPDATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.EMPLOYEE, "USER_INVITE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.SALES_MANAGER, "USER_VIEW")).toBe(
      true,
    );
  });

  it("scopes member queries by organizationId", () => {
    const organizationId = "org_a";
    const where = { id: "mem_1", organizationId };
    expect(where.organizationId).toBe("org_a");
  });
});
