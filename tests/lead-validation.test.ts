import { describe, expect, it } from "vitest";
import { leadListFilterSchema, createLeadSchema } from "@/modules/leads/validation";

describe("lead validation", () => {
  it("requires a name and rejects non-positive value", () => {
    expect(createLeadSchema.safeParse({ name: "A" }).success).toBe(false);
    expect(createLeadSchema.safeParse({ name: "Alex Rivera" }).success).toBe(true);
    expect(
      createLeadSchema.safeParse({ name: "Alex Rivera", estimatedValue: 0 }).success,
    ).toBe(false);
    expect(
      createLeadSchema.safeParse({ name: "Alex Rivera", estimatedValue: 4200 }).success,
    ).toBe(true);
  });

  it("parses list filters without trusting a client organizationId", () => {
    const parsed = leadListFilterSchema.parse({
      search: "riverside",
      status: "QUALIFIED",
      first: "20",
    });
    expect(parsed.search).toBe("riverside");
    expect(parsed.status).toBe("QUALIFIED");
    expect(parsed.first).toBe(20);
  });
});
