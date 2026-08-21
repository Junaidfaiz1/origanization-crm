import Link from "next/link";
import { Briefcase, Gavel, ListTodo } from "lucide-react";
import { requireFreelancerUser } from "@/lib/auth/page";
import { getFreelancerHome } from "@/modules/freelancer-portal/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { MoneyDisplay } from "@/components/shared/money-display";
import { DateDisplay } from "@/components/shared/date-display";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { MetricCard } from "@/components/shared/metric-card";

export const metadata = { title: "Freelancer portal" };

export default async function FreelancerHomePage() {
  const ctx = await requireFreelancerUser();

  let home;
  try {
    home = await getFreelancerHome(ctx);
  } catch {
    return (
      <ErrorState
        title="Could not load portal"
        description="Check that your account is linked to a freelancer resource."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Welcome"
        title={home.profile?.name ?? ctx.user.name}
        description="Open bid requests, your bids, assigned tasks, and time. Other freelancers' bids and agency margins stay private."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          title="Open requests"
          value={String(home.counts.openRequests)}
          href="/freelancer/requests"
          icon={Gavel}
        />
        <MetricCard
          title="My bids"
          value={String(home.counts.myBids)}
          href="/freelancer/bids"
          icon={Briefcase}
        />
        <MetricCard
          title="Active tasks"
          value={String(home.counts.activeTasks)}
          href="/freelancer/tasks"
          icon={ListTodo}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Open requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {home.openRequests.length === 0 ? (
              <EmptyState
                title="No open requests"
                description="When the agency opens bidding, eligible work will appear here."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              home.openRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/freelancer/requests/${request.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{request.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {request.projectName}
                      {request.budgetMax ? (
                        <>
                          {" · "}
                          <MoneyDisplay
                            amount={request.budgetMax}
                            currency={request.currency}
                          />
                        </>
                      ) : null}
                    </p>
                  </div>
                  <StatusBadge status={request.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {home.myTasks.length === 0 ? (
              <EmptyState
                title="No active tasks"
                description="Tasks assigned to you after a won bid will show here."
                className="border-0 bg-transparent py-8"
              />
            ) : (
              home.myTasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/freelancer/tasks/${task.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.projectName}
                      {task.dueDate ? (
                        <>
                          {" · Due "}
                          <DateDisplay value={task.dueDate} />
                        </>
                      ) : null}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
