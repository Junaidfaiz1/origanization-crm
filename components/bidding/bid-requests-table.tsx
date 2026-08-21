import Link from "next/link";
import { DateDisplay } from "@/components/shared/date-display";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import type { SerializedBidRequest } from "@/modules/bidding/service";

export function BidRequestsTable({ requests }: { requests: SerializedBidRequest[] }) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Request</th>
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Budget</th>
              <th className="px-4 py-3 font-medium">Bids</th>
              <th className="px-4 py-3 font-medium">Ends</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-muted/40">
                <td className="px-4 py-3">
                  <Link
                    href={`/bidding/requests/${request.id}`}
                    className="font-medium hover:underline"
                  >
                    {request.title}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">{request.biddingType}</p>
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/${request.projectId}`}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    {request.project.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={request.status} />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <MoneyDisplay amount={request.budgetMin} />
                  {" – "}
                  <MoneyDisplay amount={request.budgetMax} />
                </td>
                <td className="px-4 py-3">{request.bidCount}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {request.endsAt ? <DateDisplay value={request.endsAt} /> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {requests.map((request) => (
          <Link
            key={request.id}
            href={`/bidding/requests/${request.id}`}
            className="block rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{request.title}</p>
                <p className="truncate text-sm text-muted-foreground">{request.project.name}</p>
              </div>
              <StatusBadge status={request.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {request.bidCount} bids · <MoneyDisplay amount={request.budgetMin} />–
              <MoneyDisplay amount={request.budgetMax} />
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
