import Link from "next/link";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { ErrorState } from "@/components/shared/error-state";
import { BidRequestForm } from "@/components/bidding/bid-request-form";
import { listBiddingProjectOptions } from "@/modules/bidding/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "New bid request" };

export default async function NewBidRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "BID_REQUEST_CREATE")) {
    return (
      <ErrorState
        title="You cannot create bid requests"
        description="Ask an owner or project manager to grant BID_REQUEST_CREATE."
      />
    );
  }

  const params = await searchParams;
  const projects = await listBiddingProjectOptions(ctx);

  if (projects.length === 0) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <ErrorState
          title="Create a project first"
          description="Bid requests must belong to an active project."
        />
        <p className="text-center text-sm">
          <Link href="/projects/new" className="font-medium hover:underline">
            Create project
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/bidding" className="text-sm text-muted-foreground hover:text-foreground">
          ← Bidding
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Create bid request
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Request details</CardTitle>
        </CardHeader>
        <CardContent>
          <BidRequestForm projects={projects} defaultProjectId={params.projectId} />
        </CardContent>
      </Card>
    </div>
  );
}
