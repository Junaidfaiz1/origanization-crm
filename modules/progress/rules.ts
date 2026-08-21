export const PROGRESS_HEALTH = [
  "NOT_STARTED",
  "ON_TRACK",
  "AT_RISK",
  "DELAYED",
  "COMPLETED",
  "CANCELLED",
] as const;

export type ProgressHealth = (typeof PROGRESS_HEALTH)[number];

const STATUS_HEURISTIC: Record<string, number> = {
  PLANNING: 0,
  BIDDING: 8,
  RESOURCE_ASSIGNED: 15,
  IN_PROGRESS: 40,
  IN_REVIEW: 75,
  COMPLETED: 100,
  CLOSED: 100,
  CANCELLED: 0,
};

export function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}

export function ratioPercent(done: number, total: number): number | null {
  if (total <= 0) {
    return null;
  }
  return roundPercent((done / total) * 100);
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, roundPercent(value)));
}

export function overallFromParts(input: {
  status: string;
  milestonePercent: number | null;
  taskPercent: number | null;
}): number {
  if (input.status === "COMPLETED" || input.status === "CLOSED") {
    return 100;
  }
  if (input.status === "CANCELLED") {
    return 0;
  }

  const parts = [input.milestonePercent, input.taskPercent].filter(
    (value): value is number => value != null,
  );
  if (parts.length === 0) {
    return STATUS_HEURISTIC[input.status] ?? 0;
  }
  return roundPercent(parts.reduce((sum, value) => sum + value, 0) / parts.length);
}

export function scheduleExpectedPercent(
  startDate: Date | null,
  endDate: Date | null,
  now = new Date(),
): number | null {
  if (!startDate || !endDate) {
    return null;
  }
  const duration = endDate.getTime() - startDate.getTime();
  if (duration <= 0) {
    return now >= endDate ? 100 : 0;
  }
  const elapsed = now.getTime() - startDate.getTime();
  return clampPercent((elapsed / duration) * 100);
}

export function computeProgressHealth(input: {
  status: string;
  overallPercent: number;
  endDate: Date | null;
  scheduleExpectedPercent: number | null;
  now?: Date;
}): ProgressHealth {
  const now = input.now ?? new Date();
  if (input.status === "CANCELLED") {
    return "CANCELLED";
  }
  if (input.status === "COMPLETED" || input.status === "CLOSED") {
    return "COMPLETED";
  }
  if (input.endDate && now.getTime() > input.endDate.getTime()) {
    return "DELAYED";
  }
  if (
    input.overallPercent <= 0 &&
    (input.status === "PLANNING" || input.status === "BIDDING")
  ) {
    return "NOT_STARTED";
  }
  if (
    input.scheduleExpectedPercent != null &&
    input.overallPercent + 15 < input.scheduleExpectedPercent
  ) {
    return "AT_RISK";
  }
  return "ON_TRACK";
}

export type ProgressInput = {
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  milestoneTotal: number;
  milestoneCompleted: number;
  taskTotal: number;
  taskDone: number;
  estimatedHours: number;
  loggedHours: number;
  budget: number | null;
  actualCost: number | null;
};

export function computeProjectProgress(input: ProgressInput, now = new Date()) {
  const milestonePercent = ratioPercent(
    input.milestoneCompleted,
    input.milestoneTotal,
  );
  const taskPercent = ratioPercent(input.taskDone, input.taskTotal);
  const overallPercent = overallFromParts({
    status: input.status,
    milestonePercent,
    taskPercent,
  });
  const expected = scheduleExpectedPercent(input.startDate, input.endDate, now);
  const health = computeProgressHealth({
    status: input.status,
    overallPercent,
    endDate: input.endDate,
    scheduleExpectedPercent: expected,
    now,
  });

  return {
    overallPercent,
    milestonePercent,
    taskPercent,
    hoursPercent: ratioPercent(input.loggedHours, input.estimatedHours),
    budgetPercent: ratioPercent(input.actualCost ?? 0, input.budget ?? 0),
    scheduleExpectedPercent: expected,
    health,
    delayed: health === "DELAYED",
  };
}

export type PublicProgressFields = {
  hours: unknown;
  hoursPercent: number | null;
  budget: unknown;
  budgetPercent: number | null;
};

/** Strip internal hours/budget burn for client portal responses. */
export function toPublicProgress<T extends PublicProgressFields>(row: T): T {
  return {
    ...row,
    hours: null,
    hoursPercent: null,
    budget: null,
    budgetPercent: null,
  };
}
