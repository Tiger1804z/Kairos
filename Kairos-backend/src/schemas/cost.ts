import { z } from "zod";

export const createCostSchema = z.object({
  product_id: z.string().min(1, "product_id is required"),
  variant_id: z.string().optional(),
  cost_per_unit: z
    .number()
    .refine((v) => Number.isFinite(v) && v > 0, {
      message: "cost_per_unit must be a positive finite number greater than 0",
    }),
  note: z.string().optional(),
});
