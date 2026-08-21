"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { archiveOpportunityAction } from "@/modules/opportunities/actions";

export function OpportunityDetailActions({
  opportunityId,
  canUpdate,
}: {
  opportunityId: string;
  canUpdate: boolean;
}) {
  if (!canUpdate) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button variant="outline" asChild>
        <Link href={`/opportunities/${opportunityId}/edit`}>Edit</Link>
      </Button>
      <ConfirmDialog
        title="Archive this opportunity?"
        description="The deal will be hidden from lists. Proposals, projects, and history stay intact."
        confirmLabel="Archive"
        destructive
        hiddenFields={{ id: opportunityId }}
        action={archiveOpportunityAction}
        trigger={
          <Button variant="outline" type="button">
            Archive
          </Button>
        }
      />
    </div>
  );
}
