import { BusinessRuleError, NotFoundError } from "@/lib/errors/app-error";

export const CLIENT_VISIBLE_PROPOSAL_STATUSES = [
  "SENT",
  "VIEWED",
  "CHANGES_REQUESTED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
] as const;

export function assertClientPortalActor(roleKey: string | undefined): void {
  if (roleKey !== "CLIENT") {
    throw new BusinessRuleError("Client portal is only available to client users");
  }
}

export function assertOwnsClientRecord(
  resolvedClientId: string | null,
): asserts resolvedClientId is string {
  if (!resolvedClientId) {
    throw new NotFoundError("No client profile is linked to this account");
  }
}
