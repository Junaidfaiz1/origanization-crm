"use client";

import { useState, useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { MoneyDisplay } from "@/components/shared/money-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  acceptBidAction,
  negotiateBidAction,
  rejectBidAction,
  shortlistBidAction,
  submitBidAction,
  type BiddingFormState,
} from "@/modules/bidding/actions";
import type { SerializedBid } from "@/modules/bidding/service";

const initialState: BiddingFormState = {};
const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function BidComparisonTable({
  bids,
  currency,
  canShortlist,
  canReject,
  canAccept,
  canNegotiate,
}: {
  bids: SerializedBid[];
  currency: string;
  canShortlist: boolean;
  canReject: boolean;
  canAccept: boolean;
  canNegotiate: boolean;
}) {
  const [negotiateId, setNegotiateId] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState(negotiateBidAction, initialState);

  if (bids.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No bids submitted yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Score weights: price 40%, experience 20%, rating 20%, delivery 20%. Lowest price is not
        auto-selected.
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[64rem] text-left text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Bidder</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Days</th>
              <th className="px-4 py-3 font-medium">Score</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {bids.map((bid) => (
              <tr key={bid.id} className="align-top hover:bg-muted/40">
                <td className="px-4 py-3">
                  <p className="font-medium">{bid.bidder.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {bid.resource?.experienceYears ?? "—"} yrs · rating{" "}
                    {bid.resource?.rating ?? "—"} · rate{" "}
                    <MoneyDisplay amount={bid.resource?.hourlyRate} />
                  </p>
                  {bid.resource?.skills?.length ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {bid.resource.skills.map((skill) => skill.name).join(", ")}
                    </p>
                  ) : null}
                  {bid.proposal ? (
                    <p className="mt-2 max-w-sm text-xs text-muted-foreground">{bid.proposal}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <MoneyDisplay amount={bid.amount} currency={currency} />
                </td>
                <td className="px-4 py-3">{bid.estimatedDays}</td>
                <td className="px-4 py-3">
                  {bid.score ? (
                    <div>
                      <p className="font-semibold">{bid.score.total}</p>
                      <p className="text-xs text-muted-foreground">
                        P{Math.round(bid.score.price)} E{Math.round(bid.score.experience)} R
                        {Math.round(bid.score.rating)} D{Math.round(bid.score.delivery)}
                      </p>
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={bid.status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    {canShortlist &&
                    (bid.status === "SUBMITTED" || bid.status === "NEGOTIATION") ? (
                      <form action={shortlistBidAction}>
                        <input type="hidden" name="id" value={bid.id} />
                        <Button type="submit" size="sm" variant="outline">
                          Shortlist
                        </Button>
                      </form>
                    ) : null}
                    {canNegotiate &&
                    ["SUBMITTED", "SHORTLISTED", "NEGOTIATION"].includes(bid.status) ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setNegotiateId((current) => (current === bid.id ? null : bid.id))
                        }
                      >
                        Negotiate
                      </Button>
                    ) : null}
                    {canReject &&
                    !["ACCEPTED", "REJECTED", "WITHDRAWN"].includes(bid.status) ? (
                      <ConfirmDialog
                        title="Reject this bid?"
                        description="The bidder will no longer be eligible for award."
                        confirmLabel="Reject"
                        destructive
                        hiddenFields={{ id: bid.id }}
                        action={rejectBidAction}
                        trigger={
                          <Button type="button" size="sm" variant="outline">
                            Reject
                          </Button>
                        }
                      />
                    ) : null}
                    {canAccept &&
                    !["REJECTED", "WITHDRAWN", "DRAFT", "ACCEPTED"].includes(bid.status) ? (
                      <ConfirmDialog
                        title="Accept this bid?"
                        description="This awards the request, rejects other active bids, assigns the resource, and sets the project to resource assigned."
                        confirmLabel="Accept bid"
                        hiddenFields={{ id: bid.id }}
                        action={acceptBidAction}
                        trigger={
                          <Button type="button" size="sm">
                            Accept
                          </Button>
                        }
                      />
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {negotiateId ? (
        <form action={formAction} className="rounded-xl border border-border bg-card p-4 space-y-3">
          <input type="hidden" name="id" value={negotiateId} />
          <p className="text-sm font-medium">Counter-offer (does not overwrite original bid amount)</p>
          {state.message ? (
            <p className="text-sm text-destructive">{state.message}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <FormField label="Amount" htmlFor="amount" error={state.errors?.amount?.[0]}>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                required
                placeholder="3500"
              />
            </FormField>
            <FormField label="Days" htmlFor="estimatedDays" error={state.errors?.estimatedDays?.[0]}>
              <Input
                id="estimatedDays"
                name="estimatedDays"
                type="number"
                min="1"
                required
                placeholder="14"
              />
            </FormField>
            <FormField label="Message" htmlFor="message" error={state.errors?.message?.[0]}>
              <Input
                id="message"
                name="message"
                placeholder="Can deliver in two weeks at this rate"
              />
            </FormField>
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Sending…" : "Send counter"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setNegotiateId(null)}>
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}

export function SubmitBidForm({ bidRequestId }: { bidRequestId: string }) {
  const [state, formAction, pending] = useActionState(submitBidAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <input type="hidden" name="bidRequestId" value={bidRequestId} />
      <p className="text-sm font-medium">Submit your bid</p>
      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Amount" htmlFor="amount" error={state.errors?.amount?.[0]}>
          <Input
            id="amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            placeholder="3500"
          />
        </FormField>
        <FormField label="Estimated days" htmlFor="estimatedDays" error={state.errors?.estimatedDays?.[0]}>
          <Input
            id="estimatedDays"
            name="estimatedDays"
            type="number"
            min="1"
            required
            placeholder="14"
          />
        </FormField>
        <FormField label="Proposal" htmlFor="proposal" error={state.errors?.proposal?.[0]} className="sm:col-span-2">
          <textarea
            id="proposal"
            name="proposal"
            rows={3}
            className={`${selectClassName} min-h-20 py-2 placeholder:text-muted-foreground`}
            placeholder="Approach, timeline, and relevant experience…"
          />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit bid"}
      </Button>
    </form>
  );
}
