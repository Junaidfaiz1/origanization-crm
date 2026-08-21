import { BusinessRuleError } from "@/lib/errors/app-error";

export const CONTRACT_STATUSES = [
  "DRAFT",
  "SENT",
  "SIGNED",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ContractStatusKey = (typeof CONTRACT_STATUSES)[number];

export const EDITABLE_CONTRACT_STATUSES = ["DRAFT", "SENT"] as const;

export const TERMINAL_CONTRACT_STATUSES = ["COMPLETED", "CANCELLED"] as const;

const STATUS_TRANSITIONS: Record<ContractStatusKey, ContractStatusKey[]> = {
  DRAFT: ["SENT", "CANCELLED"],
  SENT: ["SIGNED", "CANCELLED"],
  SIGNED: ["ACTIVE", "CANCELLED"],
  ACTIVE: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export function assertCanEditContract(status: string): void {
  if (
    !EDITABLE_CONTRACT_STATUSES.includes(
      status as (typeof EDITABLE_CONTRACT_STATUSES)[number],
    )
  ) {
    throw new BusinessRuleError("Only draft or sent contracts can be edited");
  }
}

export function assertCanDeleteContract(status: string): void {
  if (status !== "DRAFT") {
    throw new BusinessRuleError("Only draft contracts can be deleted");
  }
}

export function assertValidContractStatusTransition(
  current: string,
  next: string,
): void {
  const allowed = STATUS_TRANSITIONS[current as ContractStatusKey];
  if (!allowed?.includes(next as ContractStatusKey)) {
    throw new BusinessRuleError(`Cannot move contract from ${current} to ${next}`);
  }
}

export function assertContractDates(startDate: Date | null, endDate: Date | null): void {
  if (startDate && endDate && endDate < startDate) {
    throw new BusinessRuleError("End date cannot be before start date");
  }
}

export function assertClientMatchesProject(projectClientId: string, clientId: string): void {
  if (projectClientId !== clientId) {
    throw new BusinessRuleError("Client must match the selected project");
  }
}
