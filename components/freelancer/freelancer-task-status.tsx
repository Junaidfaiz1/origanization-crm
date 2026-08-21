"use client";

import { TASK_STATUSES } from "@/modules/tasks/rules";
import { updateFreelancerTaskStatusAction } from "@/modules/freelancer-portal/actions";

export function FreelancerTaskStatusSelect({
  taskId,
  currentStatus,
  canUpdate,
}: {
  taskId: string;
  currentStatus: string;
  canUpdate: boolean;
}) {
  if (!canUpdate) {
    return null;
  }

  return (
    <form action={updateFreelancerTaskStatusAction} className="inline-flex">
      <input type="hidden" name="id" value={taskId} />
      <select
        name="status"
        defaultValue={currentStatus}
        aria-label="Change status"
        className="h-9 rounded-md border border-input bg-card px-3 text-sm"
        onChange={(event) => {
          event.currentTarget.form?.requestSubmit();
        }}
      >
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </form>
  );
}
