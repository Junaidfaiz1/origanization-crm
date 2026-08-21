import { z } from "zod";
import { listSortSchema } from "@/lib/ui/list-sort";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const createContactSchema = z.object({
  companyId: z.string().trim().min(1, "Company is required"),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  phone: optionalText,
  designation: optionalText,
});

export const updateContactSchema = createContactSchema.partial().extend({
  name: z.string().trim().min(2, "Name must be at least 2 characters").optional(),
  companyId: z.string().trim().min(1, "Company is required").optional(),
});

export const contactListFilterSchema = z.object({
  search: z.string().trim().optional(),
  companyId: z.string().trim().min(1).optional(),
  sort: listSortSchema,
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactListFilter = z.infer<typeof contactListFilterSchema>;
