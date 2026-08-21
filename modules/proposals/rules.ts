import { BusinessRuleError } from "@/lib/errors/app-error";

export const PROPOSAL_STATUSES = [
  "DRAFT",
  "SENT",
  "VIEWED",
  "CHANGES_REQUESTED",
  "ACCEPTED",
  "REJECTED",
  "EXPIRED",
] as const;

export type ProposalStatusKey = (typeof PROPOSAL_STATUSES)[number];

export const EDITABLE_PROPOSAL_STATUSES = ["DRAFT", "CHANGES_REQUESTED"] as const;

export const ACCEPTABLE_PROPOSAL_STATUSES = [
  "SENT",
  "VIEWED",
  "CHANGES_REQUESTED",
] as const;

export const REJECTABLE_PROPOSAL_STATUSES = ACCEPTABLE_PROPOSAL_STATUSES;

export type ProposalActionContext = {
  status: ProposalStatusKey;
  archivedAt: Date | null;
  itemCount?: number;
};

export function assertCanEditProposal(proposal: ProposalActionContext): void {
  if (proposal.archivedAt) {
    throw new BusinessRuleError("Archived proposals cannot be edited");
  }
  if (!EDITABLE_PROPOSAL_STATUSES.includes(proposal.status as (typeof EDITABLE_PROPOSAL_STATUSES)[number])) {
    throw new BusinessRuleError("Only draft or changes-requested proposals can be edited");
  }
}

export function assertCanSendProposal(proposal: ProposalActionContext): void {
  if (proposal.archivedAt) {
    throw new BusinessRuleError("Archived proposals cannot be sent");
  }
  if (proposal.status !== "DRAFT") {
    throw new BusinessRuleError("Only draft proposals can be sent");
  }
  if (!proposal.itemCount || proposal.itemCount < 1) {
    throw new BusinessRuleError("Add at least one line item before sending");
  }
}

export function assertCanAcceptProposal(proposal: ProposalActionContext): void {
  if (proposal.archivedAt) {
    throw new BusinessRuleError("Archived proposals cannot be accepted");
  }
  if (proposal.status === "ACCEPTED") {
    throw new BusinessRuleError("This proposal has already been accepted");
  }
  if (
    !ACCEPTABLE_PROPOSAL_STATUSES.includes(
      proposal.status as (typeof ACCEPTABLE_PROPOSAL_STATUSES)[number],
    )
  ) {
    throw new BusinessRuleError("Only sent proposals can be accepted");
  }
}

export function assertCanRejectProposal(proposal: ProposalActionContext): void {
  if (proposal.archivedAt) {
    throw new BusinessRuleError("Archived proposals cannot be rejected");
  }
  if (proposal.status === "REJECTED") {
    throw new BusinessRuleError("This proposal has already been rejected");
  }
  if (
    !REJECTABLE_PROPOSAL_STATUSES.includes(
      proposal.status as (typeof REJECTABLE_PROPOSAL_STATUSES)[number],
    )
  ) {
    throw new BusinessRuleError("Only sent proposals can be rejected");
  }
}

export function assertCanArchiveProposal(proposal: { archivedAt: Date | null }): void {
  if (proposal.archivedAt) {
    throw new BusinessRuleError("This proposal is already archived");
  }
}
