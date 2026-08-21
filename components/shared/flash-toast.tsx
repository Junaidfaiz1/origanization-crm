"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  FLASH_TOAST_MESSAGES,
  isFlashToastKey,
} from "@/lib/ui/flash-toast";

export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const key = params.get("toast");

  useEffect(() => {
    if (!isFlashToastKey(key)) {
      return;
    }

    toast.success(FLASH_TOAST_MESSAGES[key]);

    const next = new URLSearchParams(params.toString());
    next.delete("toast");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [key, params, pathname, router]);

  return null;
}
