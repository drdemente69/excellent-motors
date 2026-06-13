import { z } from "zod";

export const checkoutSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().min(1).max(999),
        }),
      )
      .min(1, "Your cart is empty"),
    customerName: z.string().min(2, "Please enter your full name"),
    email: z.string().email("Enter a valid email"),
    phone: z.string().min(7, "Enter a valid phone number"),
    fulfillment: z.enum(["delivery", "pickup"]),
    paymentMethod: z.enum(["cod", "mock_gateway", "cash"]),
    line1: z.string().optional(),
    line2: z.string().optional(),
    city: z.string().optional(),
    province: z.string().optional(),
    postalCode: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (d) => d.fulfillment === "pickup" || (d.line1 && d.city),
    { message: "Delivery address is required", path: ["line1"] },
  );

export type CheckoutInput = z.infer<typeof checkoutSchema>;
