import { BusinessRuleError } from "@/lib/errors/app-error";

export const OPPORTUNITY_STAGES = [
  "NEW",
  "DISCOVERY",
  "REQUIREMENTS",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export type OpportunityStageKey = (typeof OPPORTUNITY_STAGES)[number];

export const OPEN_OPPORTUNITY_STAGES = OPPORTUNITY_STAGES.filter(
  (stage) => stage !== "WON" && stage !== "LOST",
);

export type ArchivableOpportunity = {
  archivedAt: Date | null;
};

export function assertCanArchiveOpportunity(opportunity: ArchivableOpportunity): void {
  if (opportunity.archivedAt) {
    throw new BusinessRuleError("This opportunity is already archived");
  }
}
