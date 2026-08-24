"use client";

import { useTransition } from "react";
import { logoutAction } from "@/modules/auth/actions";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

/** Sign-out control for Radix account menus (form-inside-item does not submit). */
export function SignOutMenuItem() {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      disabled={pending}
      className="cursor-pointer"
      onSelect={(event) => {
        // Keep the select from racing the server action / redirect.
        event.preventDefault();
        startTransition(() => {
          void logoutAction();
        });
      }}
    >
      {pending ? "Signing out..." : "Sign out"}
    </DropdownMenuItem>
  );
}
