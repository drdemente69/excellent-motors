import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(2, "Name is required"),
  sku: z.string().min(2, "SKU is required"),
  barcode: z.string().optional().or(z.literal("")),
  partNumber: z.string().optional().or(z.literal("")),
  oemNumber: z.string().optional().or(z.literal("")),
  categoryId: z.string().min(1, "Choose a category"),
  brandId: z.string().optional().or(z.literal("")),
  price: z.coerce.number().min(0, "Price must be ≥ 0"),
  cost: z.coerce.number().min(0, "Cost must be ≥ 0"),
  taxRatePct: z.coerce.number().min(0).max(100),
  status: z.enum(["draft", "active", "archived"]),
  isFeatured: z.coerce.boolean().optional(),
  shortDesc: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  imageUrl: z.string().optional().or(z.literal("")),
  reorderLevel: z.coerce.number().int().min(0),
  initialStock: z.coerce.number().int().min(0).optional(),
});

export type ProductInput = z.infer<typeof productSchema>;
