"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { OPPORTUNITY_STAGES } from "@/modules/opportunities/rules";

type PipelineSummary = {
  openCount: number;
  totalCount: number;
  pipelineValue: string;
  weightedValue: string;
  winRate: string | null;
  stages: Array<{ stage: string; count: number; value: string }>;
};

export function OpportunityPipelineSummary({
  summary,
}: {
  summary: PipelineSummary;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const currentStage = params.get("stage") ?? "";

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Open deals"
          value={String(summary.openCount)}
          hint={`${summary.totalCount} total in pipeline`}
        />
        <SummaryCard
          label="Pipeline value"
          value={<MoneyDisplay amount={summary.pipelineValue} />}
          hint="Open stages only"
        />
        <SummaryCard
          label="Weighted value"
          value={<MoneyDisplay amount={summary.weightedValue} />}
          hint="Value × probability"
        />
        <SummaryCard
          label="Win rate"
          value={summary.winRate ? `${summary.winRate}%` : "—"}
          hint="Won vs closed (won + lost)"
        />
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max gap-3">
          {summary.stages.map((stage) => {
            const active = currentStage === stage.stage;
            return (
              <button
                key={stage.stage}
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(params.toString());
                  if (active) {
                    next.delete("stage");
                  } else {
                    next.set("stage", stage.stage);
                  }
                  next.delete("cursor");
                  router.push(`?${next.toString()}`);
                }}
                className={`w-40 rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="mb-2">
                  <StatusBadge status={stage.stage} />
                </div>
                <p className="text-lg font-semibold">{stage.count}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <MoneyDisplay amount={stage.value} />
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {currentStage ? (
        <p className="text-sm text-muted-foreground">
          Filtered to stage{" "}
          <span className="font-medium">{currentStage.replaceAll("_", " ").toLowerCase()}</span>
          {" · "}
          <Link href="/opportunities" className="hover:underline">
            Clear filter
          </Link>
        </p>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-xl font-semibold tracking-tight">{value}</div>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

export function OpportunityStageFilter() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("stage") ?? "";

  return (
    <select
      aria-label="Filter by stage"
      className="h-11 w-full rounded-md border border-input bg-card px-3 text-base sm:w-48 md:h-10 md:text-sm"
      defaultValue={current}
      onChange={(event) => {
        const next = new URLSearchParams(params.toString());
        if (event.target.value) {
          next.set("stage", event.target.value);
        } else {
          next.delete("stage");
        }
        next.delete("cursor");
        router.push(`?${next.toString()}`);
      }}
    >
      <option value="">All stages</option>
      {OPPORTUNITY_STAGES.map((stage) => (
        <option key={stage} value={stage}>
          {stage.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
