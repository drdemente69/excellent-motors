"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth-helpers";

type ActionState = { ok?: boolean; error?: string; message?: string } | undefined;

const addressSchema = z.object({
  label: z.string().optional(),
  line1: z.string().min(3, "Address is required"),
  line2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  province: z.string().optional(),
  postalCode: z.string().optional(),
  phone: z.string().optional(),
});

export async function addAddress(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const count = await prisma.address.count({ where: { userId: user.id } });
  await prisma.address.create({
    data: { ...parsed.data, userId: user.id, isDefault: count === 0 },
  });
  revalidatePath("/account/addresses");
  return { ok: true, message: "Address added" };
}

export async function deleteAddress(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id"));
  // Ownership check before deleting.
  const address = await prisma.address.findUnique({ where: { id }, select: { userId: true } });
  if (address?.userId === user.id) {
    await prisma.address.delete({ where: { id } });
    revalidatePath("/account/addresses");
  }
}

const profileSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: z.string().optional(),
});

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name,
      customerProfile: {
        upsert: {
          create: { phone: parsed.data.phone },
          update: { phone: parsed.data.phone },
        },
      },
    },
  });
  revalidatePath("/account/profile");
  return { ok: true, message: "Profile updated" };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    next: z.string().min(8, "New password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, { message: "Passwords do not match", path: ["confirm"] });

export async function changePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record?.passwordHash) return { error: "No password set on this account." };

  const valid = await bcrypt.compare(parsed.data.current, record.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await bcrypt.hash(parsed.data.next, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { ok: true, message: "Password changed" };
}
