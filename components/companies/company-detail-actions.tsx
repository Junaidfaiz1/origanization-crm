"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { archiveCompanyAction } from "@/modules/companies/actions";

export function CompanyDetailActions({
  companyId,
  canUpdate,
}: {
  companyId: string;
  canUpdate: boolean;
}) {
  if (!canUpdate) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button variant="outline" asChild>
        <Link href={`/companies/${companyId}/edit`}>Edit</Link>
      </Button>
      <ConfirmDialog
        title="Archive this company?"
        description="The company will be hidden from lists. Linked contacts, clients, and history stay intact."
        confirmLabel="Archive"
        destructive
        hiddenFields={{ id: companyId }}
        action={archiveCompanyAction}
        trigger={
          <Button variant="outline" type="button">
            Archive
          </Button>
        }
      />
    </div>
  );
}
