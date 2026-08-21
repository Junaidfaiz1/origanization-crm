import { z } from "zod";
import { listSortSchema } from "@/lib/ui/list-sort";
import { INVOICE_STATUSES } from "@/modules/invoices/rules";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const invoiceStatusSchema = z.enum(INVOICE_STATUSES);

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Item description is required"),
  quantity: z.coerce.number().positive("Quantity must be greater than zero"),
  unitPrice: z.coerce.number().min(0, "Unit price cannot be negative"),
});

export const createInvoiceSchema = z.object({
  clientId: z.string().trim().min(1, "Client is required"),
  projectId: optionalId,
  discount: z.coerce.number().min(0, "Discount cannot be negative").optional().default(0),
  tax: z.coerce.number().min(0, "Tax cannot be negative").optional().default(0),
  currency: z.string().trim().min(3).max(3).optional().default("USD"),
  issueDate: z.string().trim().min(1, "Issue date is required"),
  dueDate: optionalText,
  notes: optionalText,
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item"),
});

export const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  clientId: z.string().trim().min(1, "Client is required").optional(),
  issueDate: z.string().trim().min(1, "Issue date is required").optional(),
  items: z.array(invoiceItemSchema).min(1, "Add at least one line item").optional(),
});

export const invoiceListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: invoiceStatusSchema.optional(),
  clientId: z.string().trim().min(1).optional(),
  projectId: z.string().trim().min(1).optional(),
  sort: listSortSchema,
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceListFilter = z.infer<typeof invoiceListFilterSchema>;
