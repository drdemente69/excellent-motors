"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { vendorSchema } from "@/lib/validations/purchasing";

type State = { error?: string } | undefined;

async function nextVendorCode() {
  const count = await prisma.vendor.count();
  return `VND-${String(count + 1).padStart(3, "0")}`;
}

export async function createVendor(_prev: State, formData: FormData): Promise<State> {
  await requireRole("inventory_manager", "admin");
  const parsed = vendorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  const code = (d.code || (await nextVendorCode())).toUpperCase().replace(/\s+/g, "-");

  const exists = await prisma.vendor.findUnique({ where: { code } });
  if (exists) return { error: "A vendor with that code already exists." };

  await prisma.vendor.create({
    data: {
      name: d.name,
      code,
      contactName: d.contactName || null,
      email: d.email || null,
      phone: d.phone || null,
      address: d.address || null,
      taxId: d.taxId || null,
      notes: d.notes || null,
    },
  });
  revalidatePath("/admin/vendors");
  redirect("/admin/vendors");
}

export async function updateVendor(_prev: State, formData: FormData): Promise<State> {
  await requireRole("inventory_manager", "admin");
  const id = String(formData.get("id"));
  const parsed = vendorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  await prisma.vendor.update({
    where: { id },
    data: {
      name: d.name,
      contactName: d.contactName || null,
      email: d.email || null,
      phone: d.phone || null,
      address: d.address || null,
      taxId: d.taxId || null,
      notes: d.notes || null,
    },
  });
  revalidatePath(`/admin/vendors/${id}`);
  redirect(`/admin/vendors/${id}`);
}

export async function toggleVendorActive(formData: FormData): Promise<void> {
  await requireRole("inventory_manager", "admin");
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  await prisma.vendor.update({ where: { id }, data: { isActive: active } });
  revalidatePath("/admin/vendors");
}
