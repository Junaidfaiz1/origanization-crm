import { BusinessRuleError } from "@/lib/errors/app-error";

export type ArchivableCompany = {
  archivedAt: Date | null;
  _count?: {
    clients: number;
    contacts: number;
  };
};

export function assertCanArchiveCompany(company: ArchivableCompany): void {
  if (company.archivedAt) {
    throw new BusinessRuleError("This company is already archived");
  }
}
