import { z } from "zod";
import { listSortSchema } from "@/lib/ui/list-sort";
import { PAYMENT_METHODS, PAYMENT_STATUSES } from "@/modules/payments/rules";

const optionalText = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const paymentStatusSchema = z.enum(PAYMENT_STATUSES);
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);

export const recordPaymentSchema = z.object({
  invoiceId: z.string().trim().min(1, "Invoice is required"),
  amount: z.string().trim().min(1, "Amount is required"),
  currency: z.string().trim().min(3).max(3).optional().default("USD"),
  method: paymentMethodSchema,
  reference: optionalText,
  paidAt: z.string().trim().min(1, "Paid date is required"),
  notes: optionalText,
});

export const paymentListFilterSchema = z.object({
  search: z.string().trim().optional(),
  status: paymentStatusSchema.optional(),
  invoiceId: z.string().trim().min(1).optional(),
  method: paymentMethodSchema.optional(),
  sort: listSortSchema,
  cursor: z.string().trim().optional(),
  first: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type PaymentListFilter = z.infer<typeof paymentListFilterSchema>;
