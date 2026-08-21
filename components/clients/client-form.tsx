"use client";

import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/shared/form-field";
import { CLIENT_STATUSES } from "@/modules/clients/validation";
import {
  createClientAction,
  updateClientAction,
  type ClientFormState,
} from "@/modules/clients/actions";
import type { SerializedClient } from "@/modules/clients/service";

const initialState: ClientFormState = {};

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type CompanyOption = {
  id: string;
  name: string;
};

type ContactOption = {
  id: string;
  name: string;
  companyId: string;
};

type ClientFormProps = {
  client?: SerializedClient;
  companies: CompanyOption[];
  contacts: ContactOption[];
  defaultCompanyId?: string;
  defaultPrimaryContactId?: string;
};

export function ClientForm({
  client,
  companies,
  contacts,
  defaultCompanyId,
  defaultPrimaryContactId,
}: ClientFormProps) {
  const action = client ? updateClientAction : createClientAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [companyId, setCompanyId] = useState(
    client?.companyId ?? defaultCompanyId ?? "",
  );
  const [primaryContactId, setPrimaryContactId] = useState(
    client?.primaryContactId ?? defaultPrimaryContactId ?? "",
  );

  const companyContacts = useMemo(
    () => contacts.filter((contact) => contact.companyId === companyId),
    [contacts, companyId],
  );

  const validPrimaryContactId = companyContacts.some(
    (contact) => contact.id === primaryContactId,
  )
    ? primaryContactId
    : "";

  return (
    <form action={formAction} className="space-y-4">
      {client ? <input type="hidden" name="id" value={client.id} /> : null}
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
            value={companyId}
            onChange={(event) => {
              setCompanyId(event.target.value);
              setPrimaryContactId("");
            }}
            className={selectClassName}
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
        <FormField
          label="Primary contact"
          htmlFor="primaryContactId"
          error={state.errors?.primaryContactId?.[0]}
          className="sm:col-span-2"
        >
          <select
            id="primaryContactId"
            name="primaryContactId"
            value={validPrimaryContactId}
            onChange={(event) => setPrimaryContactId(event.target.value)}
            className={selectClassName}
            disabled={!companyId}
          >
            <option value="">No primary contact</option>
            {companyContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Status" htmlFor="status" error={state.errors?.status?.[0]}>
          <select
            id="status"
            name="status"
            defaultValue={client?.status ?? "ACTIVE"}
            className={selectClassName}
          >
            {CLIENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Notes" htmlFor="notes" error={state.errors?.notes?.[0]} className="sm:col-span-2">
          <Input id="notes" name="notes" defaultValue={client?.notes ?? ""} />
        </FormField>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : client ? "Save client" : "Create client"}
      </Button>
    </form>
  );
}
