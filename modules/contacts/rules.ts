import { BusinessRuleError } from "@/lib/errors/app-error";

export type ArchivableContact = {
  archivedAt: Date | null;
  _count?: {
    primaryFor: number;
  };
};

export function assertCanArchiveContact(contact: ArchivableContact): void {
  if (contact.archivedAt) {
    throw new BusinessRuleError("This contact is already archived");
  }

  if (contact._count && contact._count.primaryFor > 0) {
    throw new BusinessRuleError(
      "Cannot archive a contact who is the primary contact for an active client",
    );
  }
}
