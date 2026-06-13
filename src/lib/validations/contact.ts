import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().optional().or(z.literal("")),
  subject: z.string().min(2, "Please add a subject"),
  message: z.string().min(10, "Please add a few more details"),
});

export type ContactInput = z.infer<typeof contactSchema>;
