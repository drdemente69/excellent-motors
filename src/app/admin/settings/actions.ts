"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth-helpers";
import { setSetting } from "@/lib/settings";

type State = { ok?: boolean; error?: string; message?: string } | undefined;

const settingsSchema = z.object({
  businessName: z.string().min(2),
  taxRatePct: z.coerce.number().min(0).max(100),
  currency: z.string().min(1),
  lowStockThreshold: z.coerce.number().int().min(0),
  address: z.string().min(2),
  phone: z.string().min(3),
  email: z.string().email(),
  ntn: z.string().min(1),
});

export async function updateSettings(_prev: State, formData: FormData): Promise<State> {
  await requireRole("admin");
  const parsed = settingsSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  await Promise.all([
    setSetting("businessName", d.businessName),
    setSetting("taxRatePct", d.taxRatePct),
    setSetting("currency", d.currency),
    setSetting("lowStockThreshold", d.lowStockThreshold),
    setSetting("address", d.address),
    setSetting("phone", d.phone),
    setSetting("email", d.email),
    setSetting("ntn", d.ntn),
  ]);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved" };
}
