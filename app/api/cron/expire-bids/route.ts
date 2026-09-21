import { handleCronGet } from "@/app/api/cron/_shared";
import { expireBids } from "@/modules/cron/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handleCronGet(request, "expire-bids", () => expireBids());
}
