import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { ProgressBar } from "@/components/progress/progress-bar";
import type { SerializedProjectProgress } from "@/modules/progress/service";

export function ProjectProgressCard({
  progress,
  href,
}: {
  progress: SerializedProjectProgress;
  href?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle>Progress</CardTitle>
        <StatusBadge status={progress.health} />
      </CardHeader>
      <CardContent className="space-y-4">
        <ProgressBar value={progress.overallPercent} label="Overall" />
        <ProgressBar
          value={progress.milestonePercent}
          label={`Milestones (${progress.milestones.completed}/${progress.milestones.total})`}
        />
        <ProgressBar
          value={progress.taskPercent}
          label={`Tasks (${progress.tasks.done}/${progress.tasks.total})`}
        />
        {progress.hours ? (
          <ProgressBar
            value={progress.hoursPercent}
            label={`Hours (${progress.hours.logged} / ${progress.hours.estimated})`}
          />
        ) : null}
        {progress.budget ? (
          <ProgressBar
            value={progress.budgetPercent}
            label={`Budget used (${progress.budget.actual} / ${progress.budget.planned})`}
          />
        ) : null}
        {progress.scheduleExpectedPercent != null ? (
          <p className="text-xs text-muted-foreground">
            Schedule expected {Math.round(progress.scheduleExpectedPercent)}%
          </p>
        ) : null}
        {href ? (
          <Link href={href} className="inline-block text-xs font-medium hover:underline">
            View progress board
          </Link>
        ) : null}
      </CardContent>
    </Card>
  );
}
