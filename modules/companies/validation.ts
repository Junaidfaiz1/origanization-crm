import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const createCompanySchema = z.object({
  name: z.string().trim().min(2, "Company name must be at least 2 characters"),
  website: optionalText,
  industry: optionalText,
  address: optionalText,
  city: optionalText,
  country: optionalText,
});

export const updateCompanySchema = createCompanySchema.partial().extend({
  name: z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters")
    .optional(),
});

export const companyListFilterSchema = z.object({
  search: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyListFilter = z.infer<typeof companyListFilterSchema>;
