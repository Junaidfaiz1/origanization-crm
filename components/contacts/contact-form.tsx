"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import {
  createContactAction,
  updateContactAction,
  type ContactFormState,
} from "@/modules/contacts/actions";
import type { SerializedContact } from "@/modules/contacts/service";

const initialState: ContactFormState = {};

type CompanyOption = {
  id: string;
  name: string;
};

type ContactFormProps = {
  contact?: SerializedContact;
  companies: CompanyOption[];
  defaultCompanyId?: string;
};

export function ContactForm({ contact, companies, defaultCompanyId }: ContactFormProps) {
  const action = contact ? updateContactAction : createContactAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {contact ? <input type="hidden" name="id" value={contact.id} /> : null}
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Company"
          htmlFor="companyId"
          error={state.errors?.companyId?.[0]}
          className="sm:col-span-2"
        >
          <select
            id="companyId"
            name="companyId"
            required
            defaultValue={contact?.companyId ?? defaultCompanyId ?? ""}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <option value="" disabled>
              Select a company
            </option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Full name" htmlFor="name" error={state.errors?.name?.[0]}>
          <Input
            id="name"
            name="name"
            required
            defaultValue={contact?.name ?? ""}
            placeholder="Jane Doe"
          />
        </FormField>
        <FormField label="Designation" htmlFor="designation" error={state.errors?.designation?.[0]}>
          <Input
            id="designation"
            name="designation"
            placeholder="Clinic Director"
            defaultValue={contact?.designation ?? ""}
          />
        </FormField>
        <FormField label="Email" htmlFor="email" error={state.errors?.email?.[0]}>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={contact?.email ?? ""}
            placeholder="you@company.com"
          />
        </FormField>
        <FormField label="Phone" htmlFor="phone" error={state.errors?.phone?.[0]}>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={contact?.phone ?? ""}
            placeholder="+1 555 0100"
          />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : contact ? "Save contact" : "Create contact"}
      </Button>
    </form>
  );
}
