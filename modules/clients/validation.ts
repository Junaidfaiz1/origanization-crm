import { z } from "zod";

export const CLIENT_STATUSES = ["ACTIVE", "INACTIVE", "ON_HOLD"] as const;

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const clientStatusSchema = z.enum(CLIENT_STATUSES);

export const createClientSchema = z.object({
  companyId: z.string().trim().min(1, "Company is required"),
  primaryContactId: z.string().trim().min(1).optional().or(z.literal("")),
  status: clientStatusSchema.optional().default("ACTIVE"),
  notes: optionalText,
});

export const updateClientSchema = createClientSchema.partial().extend({
  companyId: z.string().trim().min(1, "Company is required").optional(),
});

export const clientListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: clientStatusSchema.optional(),
  companyId: z.string().trim().min(1).optional(),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ClientListFilter = z.infer<typeof clientListFilterSchema>;
