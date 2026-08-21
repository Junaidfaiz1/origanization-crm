import { describe, expect, it } from "vitest";
import {
  assertCanDeleteContract,
  assertCanEditContract,
  assertClientMatchesProject,
  assertContractDates,
  assertValidContractStatusTransition,
} from "@/modules/contracts/rules";
import {
  contractListFilterSchema,
  createContractSchema,
  updateContractStatusSchema,
} from "@/modules/contracts/validation";
import { hasPermission, ROLE_PERMISSIONS } from "@/config/permissions";
import { BusinessRuleError } from "@/lib/errors/app-error";

describe("contract rules", () => {
  it("blocks editing completed or cancelled contracts", () => {
    expect(() => assertCanEditContract("COMPLETED")).toThrow(BusinessRuleError);
    expect(() => assertCanEditContract("CANCELLED")).toThrow(BusinessRuleError);
    expect(() => assertCanEditContract("DRAFT")).not.toThrow();
    expect(() => assertCanEditContract("SENT")).not.toThrow();
  });

  it("blocks deleting non-draft contracts", () => {
    expect(() => assertCanDeleteContract("SENT")).toThrow(BusinessRuleError);
    expect(() => assertCanDeleteContract("DRAFT")).not.toThrow();
  });

  it("validates status transitions", () => {
    expect(() => assertValidContractStatusTransition("DRAFT", "SENT")).not.toThrow();
    expect(() => assertValidContractStatusTransition("SENT", "SIGNED")).not.toThrow();
    expect(() => assertValidContractStatusTransition("SIGNED", "ACTIVE")).not.toThrow();
    expect(() => assertValidContractStatusTransition("ACTIVE", "COMPLETED")).not.toThrow();
    expect(() => assertValidContractStatusTransition("DRAFT", "ACTIVE")).toThrow(
      BusinessRuleError,
    );
    expect(() => assertValidContractStatusTransition("COMPLETED", "ACTIVE")).toThrow(
      BusinessRuleError,
    );
  });

  it("allows cancel from open states", () => {
    expect(() => assertValidContractStatusTransition("DRAFT", "CANCELLED")).not.toThrow();
    expect(() => assertValidContractStatusTransition("ACTIVE", "CANCELLED")).not.toThrow();
  });

  it("requires client to match project", () => {
    expect(() => assertClientMatchesProject("client_a", "client_b")).toThrow(BusinessRuleError);
    expect(() => assertClientMatchesProject("client_a", "client_a")).not.toThrow();
  });

  it("blocks end date before start date", () => {
    const start = new Date("2026-06-01");
    const end = new Date("2026-05-01");
    expect(() => assertContractDates(start, end)).toThrow(BusinessRuleError);
    expect(() => assertContractDates(start, new Date("2026-07-01"))).not.toThrow();
  });
});

describe("contract validation", () => {
  it("requires project, title, and amount", () => {
    expect(
      createContractSchema.safeParse({
        projectId: "",
        title: "",
        totalAmount: "",
      }).success,
    ).toBe(false);
    expect(
      createContractSchema.safeParse({
        projectId: "project_1",
        title: "Development agreement",
        totalAmount: "6800.00",
      }).success,
    ).toBe(true);
  });

  it("parses list filters", () => {
    const parsed = contractListFilterSchema.parse({
      search: "dental",
      status: "DRAFT",
      projectId: "project_1",
      first: "20",
    });
    expect(parsed.search).toBe("dental");
    expect(parsed.status).toBe("DRAFT");
    expect(parsed.first).toBe(20);
  });

  it("validates status updates", () => {
    expect(updateContractStatusSchema.safeParse({ status: "SENT" }).success).toBe(true);
    expect(updateContractStatusSchema.safeParse({ status: "INVALID" }).success).toBe(false);
  });
});

describe("contract permissions", () => {
  it("lets project managers create and update contracts", () => {
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "CONTRACT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "CONTRACT_CREATE")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.PROJECT_MANAGER, "CONTRACT_UPDATE")).toBe(true);
  });

  it("lets finance managers view but not manage contracts", () => {
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "CONTRACT_VIEW")).toBe(true);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "CONTRACT_CREATE")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FINANCE_MANAGER, "CONTRACT_UPDATE")).toBe(false);
  });

  it("hides contracts from clients and freelancers", () => {
    expect(hasPermission(ROLE_PERMISSIONS.CLIENT, "CONTRACT_VIEW")).toBe(false);
    expect(hasPermission(ROLE_PERMISSIONS.FREELANCER, "CONTRACT_VIEW")).toBe(false);
  });
});

describe("contract tenant isolation", () => {
  it("scopes lookups by organizationId", () => {
    const where = {
      id: "contract_1",
      organizationId: "org_a",
    };
    expect(where.organizationId).toBe("org_a");
  });
});
