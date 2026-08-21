"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import {
  negotiateFreelancerBidAction,
  submitFreelancerBidAction,
  type FreelancerFormState,
} from "@/modules/freelancer-portal/actions";

const initialState: FreelancerFormState = {};

const textareaClassName =
  "flex min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function FreelancerSubmitBidForm({ bidRequestId }: { bidRequestId: string }) {
  const [state, formAction, pending] = useActionState(
    submitFreelancerBidAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-border bg-card p-4">
      <input type="hidden" name="bidRequestId" value={bidRequestId} />
      <p className="text-sm font-medium">Submit your bid</p>
      {state.message ? <p className="text-sm text-destructive">{state.message}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Amount" htmlFor="amount" error={state.errors?.amount?.[0]}>
          <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
        </FormField>
        <FormField
          label="Estimated days"
          htmlFor="estimatedDays"
          error={state.errors?.estimatedDays?.[0]}
        >
          <Input id="estimatedDays" name="estimatedDays" type="number" min="1" required />
        </FormField>
        <FormField
          label="Proposal"
          htmlFor="proposal"
          error={state.errors?.proposal?.[0]}
          className="sm:col-span-2"
        >
          <textarea id="proposal" name="proposal" rows={3} className={textareaClassName} />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "Submit bid"}
      </Button>
    </form>
  );
}

export function FreelancerNegotiateBidForm({ bidId }: { bidId: string }) {
  const [state, formAction, pending] = useActionState(
    negotiateFreelancerBidAction,
    initialState,
  );

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
          <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
        </FormField>
        <FormField label="Days" htmlFor="estimatedDays" error={state.errors?.estimatedDays?.[0]}>
          <Input id="estimatedDays" name="estimatedDays" type="number" min="1" required />
        </FormField>
        <FormField label="Message" htmlFor="message" error={state.errors?.message?.[0]}>
          <Input id="message" name="message" />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send counter"}
      </Button>
    </form>
  );
}
