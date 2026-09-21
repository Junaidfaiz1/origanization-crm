import { timingSafeEqual } from "node:crypto";
import { AuthorizationError } from "@/lib/errors/app-error";

function secretsEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

/** Authorize Vercel Cron (Bearer) or manual `x-cron-secret` calls. */
export function assertCronAuthorized(request: Request): void {
  const secret = (process.env.CRON_SECRET ?? "").trim();

  if (!secret || secret.length < 8) {
    throw new AuthorizationError("CRON_SECRET is not configured");
  }

  const auth = request.headers.get("authorization");
  const bearer =
    auth?.startsWith("Bearer ") || auth?.startsWith("bearer ")
      ? auth.slice(7).trim()
      : "";
  const header = request.headers.get("x-cron-secret")?.trim() ?? "";

  if (
    (bearer && secretsEqual(bearer, secret)) ||
    (header && secretsEqual(header, secret))
  ) {
    return;
  }

  throw new AuthorizationError("Invalid cron secret");
}
