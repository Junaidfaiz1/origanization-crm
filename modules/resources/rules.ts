import { BusinessRuleError } from "@/lib/errors/app-error";

export const RESOURCE_TYPES = ["EMPLOYEE", "FREELANCER"] as const;
export const AVAILABILITY_STATUSES = ["AVAILABLE", "BUSY", "UNAVAILABLE"] as const;

export type ResourceTypeKey = (typeof RESOURCE_TYPES)[number];
export type AvailabilityStatusKey = (typeof AVAILABILITY_STATUSES)[number];

export function assertCanDeleteResource(counts: {
  projectMemberCount: number;
  contractCount: number;
  bidCount: number;
}): void {
  if (counts.projectMemberCount > 0) {
    throw new BusinessRuleError("Remove this resource from projects before deleting");
  }
  if (counts.contractCount > 0) {
    throw new BusinessRuleError("This resource has contracts and cannot be deleted");
  }
  if (counts.bidCount > 0) {
    throw new BusinessRuleError("This resource has bids and cannot be deleted");
  }
}
