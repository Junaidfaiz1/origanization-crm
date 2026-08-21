import { z } from "zod";
import { NOTIFICATION_TYPES } from "@/modules/notifications/types";

export const notificationListFilterSchema = z.object({
  unreadOnly: z
    .union([z.boolean(), z.string()])
    .optional()
    .transform((value) => value === true || value === "true"),
  type: z.enum(NOTIFICATION_TYPES).optional(),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type NotificationListFilter = z.infer<typeof notificationListFilterSchema>;
