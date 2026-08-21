import { BusinessRuleError } from "@/lib/errors/app-error";

export function assertFreelancerPortalActor(roleKey: string | undefined): void {
  if (roleKey !== "FREELANCER") {
    throw new BusinessRuleError("Freelancer portal is only available to freelancer users");
  }
}
