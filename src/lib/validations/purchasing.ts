import { z } from "zod";

export const vendorSchema = z.object({
  name: z.string().min(2, "Vendor name is required"),
  code: z.string().optional().or(z.literal("")),
  contactName: z.string().optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  taxId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type VendorInput = z.infer<typeof vendorSchema>;
