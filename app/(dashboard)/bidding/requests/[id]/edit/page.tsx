import Link from "next/link";
import { notFound } from "next/navigation";
import { requireDashboardUser } from "@/lib/auth/page";
import { hasPermission } from "@/config/permissions";
import { NotFoundError } from "@/lib/errors/app-error";
import { ErrorState } from "@/components/shared/error-state";
import { BidRequestForm } from "@/components/bidding/bid-request-form";
import {
  getBidRequest,
  listBiddingProjectOptions,
} from "@/modules/bidding/service";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Edit bid request" };

export default async function EditBidRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireDashboardUser();
  if (!hasPermission(ctx.permissions, "BID_REQUEST_UPDATE")) {
    return (
      <ErrorState
        title="You cannot edit bid requests"
        description="Ask an owner or project manager to grant BID_REQUEST_UPDATE."
      />
    );
  }

  const { id } = await params;

  let request;
  try {
    request = await getBidRequest(ctx, id);
  } catch (error) {
    if (error instanceof NotFoundError) {
      notFound();
    }
    return (
      <ErrorState
        title="Could not load this bid request"
        description="Check the database connection and try again."
      />
    );
  }

  if (request.status !== "DRAFT") {
    return (
      <ErrorState
        title="Only draft requests can be edited"
        description="Open, pause, or cancel from the request detail page."
      />
    );
  }

  const projects = await listBiddingProjectOptions(ctx);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/bidding/requests/${request.id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {request.title}
        </Link>
        <h1 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">
          Edit bid request
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Request details</CardTitle>
        </CardHeader>
        <CardContent>
          <BidRequestForm request={request} projects={projects} />
        </CardContent>
      </Card>
    </div>
  );
}
