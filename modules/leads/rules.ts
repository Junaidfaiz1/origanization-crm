import { BusinessRuleError } from "@/lib/errors/app-error";

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "UNQUALIFIED",
  "CONVERTED",
  "LOST",
] as const;

export type LeadStatusValue = (typeof LEAD_STATUSES)[number];

export type ConvertibleLead = {
  status: string;
  archivedAt: Date | null;
  convertedClientId: string | null;
};

export function assertCanConvertLead(lead: ConvertibleLead): void {
  if (lead.archivedAt) {
    throw new BusinessRuleError("Archived leads cannot be converted");
  }
  if (lead.status === "CONVERTED" || lead.convertedClientId) {
    throw new BusinessRuleError("This lead has already been converted");
  }
}

export function conversionNames(lead: {
  name: string;
  companyName: string | null;
}): { companyName: string; opportunityName: string } {
  const companyName = lead.companyName?.trim() || lead.name;
  return {
    companyName,
    opportunityName: `${companyName} — new opportunity`,
  };
}

export function isLeadStatus(value: string): value is LeadStatusValue {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}
