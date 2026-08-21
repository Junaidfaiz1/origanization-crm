import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedOpportunity } from "@/modules/opportunities/service";

type KanbanBoard = {
  columns: Array<{ stage: string; opportunities: SerializedOpportunity[] }>;
  totalCount: number;
};

export function OpportunityKanbanBoard({ board }: { board: KanbanBoard }) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {board.columns.map((column) => (
          <div
            key={column.stage}
            className="w-72 shrink-0 rounded-lg border border-border bg-muted/30"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <StatusBadge status={column.stage} />
              <span className="text-caption text-muted-foreground">
                {column.opportunities.length}
              </span>
            </div>
            <div className="space-y-2 p-2">
              {column.opportunities.length === 0 ? (
                <p className="px-2 py-8 text-center text-caption text-muted-foreground">
                  No deals
                </p>
              ) : (
                column.opportunities.map((opportunity) => (
                  <OpportunityKanbanCard
                    key={opportunity.id}
                    opportunity={opportunity}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpportunityKanbanCard({
  opportunity,
}: {
  opportunity: SerializedOpportunity;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3 shadow-xs">
      <Link
        href={`/opportunities/${opportunity.id}`}
        className="block text-sm font-medium hover:underline"
      >
        {opportunity.name}
      </Link>
      <p className="mt-1 truncate text-caption text-muted-foreground">
        {opportunity.client.companyName}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <MoneyDisplay
          amount={opportunity.estimatedValue}
          className="text-sm font-medium"
        />
        {opportunity.expectedCloseDate ? (
          <span className="text-caption text-muted-foreground">
            <DateDisplay value={opportunity.expectedCloseDate} />
          </span>
        ) : null}
      </div>
      {opportunity.assignedTo ? (
        <p className="mt-2 text-caption text-muted-foreground">
          {opportunity.assignedTo.name}
        </p>
      ) : null}
    </div>
  );
}
