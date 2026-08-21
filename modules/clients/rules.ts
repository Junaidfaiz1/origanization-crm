import { BusinessRuleError } from "@/lib/errors/app-error";

export type ArchivableClient = {
  archivedAt: Date | null;
};

export function assertCanArchiveClient(client: ArchivableClient): void {
  if (client.archivedAt) {
    throw new BusinessRuleError("This client is already archived");
  }
}
