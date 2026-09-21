import { NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron/auth";
import { AppError } from "@/lib/errors/app-error";
import { logger } from "@/lib/logging/logger";
import type { CronJobResult } from "@/modules/cron/service";

export async function handleCronGet(
  request: Request,
  jobName: string,
  job: () => Promise<CronJobResult>,
): Promise<NextResponse> {
  try {
    assertCronAuthorized(request);
    const result = await job();
    return NextResponse.json({ ok: true, job: jobName, ...result });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: error.statusCode },
      );
    }

    logger.error("Cron job failed", {
      operation: `cron.${jobName}`,
      error,
    });
    return NextResponse.json(
      { ok: false, error: "Cron job failed" },
      { status: 500 },
    );
  }
}
