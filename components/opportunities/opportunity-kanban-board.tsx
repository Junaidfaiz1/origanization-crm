import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { SerializedOpportunity } from "@/modules/opportunities/service";

type KanbanBoard = {
  columns: Array<{ stage: string; opportunities: SerializedOpportunity[] }>;
  totalCount: number;
};

/** Stage swatches step from light to dark cobalt, then green/red for closed stages. */
const STAGE_SWATCH: Record<string, string> = {
  NEW: "#b9c5f8",
  DISCOVERY: "#8ea1f2",
  REQUIREMENTS: "#5c77e8",
  PROPOSAL: "#3a59e0",
  NEGOTIATION: "#2443d9",
  WON: "#0b7a53",
  LOST: "#b93a0a",
};

function stageLabel(stage: string) {
  const text = stage.replaceAll("_", " ").toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function columnTotal(opportunities: SerializedOpportunity[]) {
  return opportunities.reduce((sum, opportunity) => {
    const value = Number(opportunity.estimatedValue ?? 0);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

export function OpportunityKanbanBoard({ board }: { board: KanbanBoard }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-2">
      <div className="flex min-w-max gap-3.5">
        {board.columns.map((column) => (
          <section
            key={column.stage}
            aria-label={stageLabel(column.stage)}
            className="flex w-[17rem] shrink-0 flex-col gap-2.5 rounded-xl bg-secondary p-2.5"
          >
            <header className="flex flex-col gap-1.5 px-1.5 pt-1.5 pb-1">
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-[3px]"
                  style={{ background: STAGE_SWATCH[column.stage] ?? "#8e95a3" }}
                  aria-hidden
                />
                <h2 className="flex-1 font-display text-[15px] font-semibold">
                  {stageLabel(column.stage)}
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {column.opportunities.length}
                </span>
              </div>
              <MoneyDisplay
                amount={columnTotal(column.opportunities)}
                className="text-[13px] text-muted-foreground"
              />
            </header>

            {column.opportunities.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border-strong px-2 py-8 text-center text-caption text-muted-foreground">
                No deals
              </p>
            ) : (
              column.opportunities.map((opportunity) => (
                <OpportunityKanbanCard key={opportunity.id} opportunity={opportunity} />
              ))
            )}
          </section>
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
    <article className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3.5 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            href={`/opportunities/${opportunity.id}`}
            className="block text-sm font-semibold hover:underline"
          >
            {opportunity.name}
          </Link>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {opportunity.client.companyName}
          </p>
        </div>
        {opportunity.assignedTo ? (
          <UserAvatar name={opportunity.assignedTo.name} size="sm" />
        ) : null}
      </div>
      <div className="flex items-center justify-between gap-2">
        <MoneyDisplay
          amount={opportunity.estimatedValue}
          className="text-[15px] font-semibold"
        />
        {opportunity.expectedCloseDate ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden />
            <DateDisplay value={opportunity.expectedCloseDate} />
          </span>
        ) : null}
      </div>
    </article>
  );
}
