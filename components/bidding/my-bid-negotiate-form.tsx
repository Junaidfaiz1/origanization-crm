"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import {
  negotiateBidAction,
  type BiddingFormState,
} from "@/modules/bidding/actions";

const initialState: BiddingFormState = {};

export function MyBidNegotiateForm({ bidId }: { bidId: string }) {
  const [state, formAction, pending] = useActionState(negotiateBidAction, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <input type="hidden" name="id" value={bidId} />
      <p className="text-sm font-medium">Reply with a counter-offer</p>
      <p className="text-xs text-muted-foreground">
        Your original bid amount stays unchanged; negotiation history is appended.
      </p>
      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
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
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send counter"}
      </Button>
    </form>
  );
}
