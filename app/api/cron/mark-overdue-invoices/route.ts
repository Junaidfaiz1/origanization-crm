import { handleCronGet } from "@/app/api/cron/_shared";
import { markOverdueInvoices } from "@/modules/cron/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleCronGet(request, "mark-overdue-invoices", () =>
    markOverdueInvoices(),
  );
}
