"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import {
  createCompanyAction,
  updateCompanyAction,
  type CompanyFormState,
} from "@/modules/companies/actions";
import type { SerializedCompany } from "@/modules/companies/service";

const initialState: CompanyFormState = {};

type CompanyFormProps = {
  company?: SerializedCompany;
};

export function CompanyForm({ company }: CompanyFormProps) {
  const action = company ? updateCompanyAction : createCompanyAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {company ? <input type="hidden" name="id" value={company.id} /> : null}
      {state.message ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-destructive dark:bg-red-950/40">
          {state.message}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Company name" htmlFor="name" error={state.errors?.name?.[0]}>
          <Input id="name" name="name" required defaultValue={company?.name ?? ""} />
        </FormField>
        <FormField label="Website" htmlFor="website" error={state.errors?.website?.[0]}>
          <Input
            id="website"
            name="website"
            type="url"
            placeholder="https://example.com"
            defaultValue={company?.website ?? ""}
          />
        </FormField>
        <FormField label="Industry" htmlFor="industry" error={state.errors?.industry?.[0]}>
          <Input id="industry" name="industry" defaultValue={company?.industry ?? ""} />
        </FormField>
        <FormField label="Country" htmlFor="country" error={state.errors?.country?.[0]}>
          <Input id="country" name="country" defaultValue={company?.country ?? ""} />
        </FormField>
        <FormField label="City" htmlFor="city" error={state.errors?.city?.[0]}>
          <Input id="city" name="city" defaultValue={company?.city ?? ""} />
        </FormField>
        <FormField label="Address" htmlFor="address" error={state.errors?.address?.[0]}>
          <Input id="address" name="address" defaultValue={company?.address ?? ""} />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : company ? "Save company" : "Create company"}
      </Button>
    </form>
  );
}
