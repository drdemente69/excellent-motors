"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { adjustStock, transferStock } from "@/lib/inventory/service";
import { InsufficientStockError } from "@/lib/inventory/errors";
import { slugify } from "@/lib/utils";

type State = { ok?: boolean; error?: string; message?: string } | undefined;

const adjustSchema = z.object({
  productId: z.string().min(1, "Choose a product"),
  newQuantity: z.coerce.number().int().min(0, "Quantity must be ≥ 0"),
  reason: z.string().min(2, "A reason is required"),
});

export async function adjustStockAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireRole("inventory_manager", "admin");
  const parsed = adjustSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  await adjustStock(d.productId, d.newQuantity, { reason: d.reason, actorId: user.id });
  revalidatePath("/admin/stock");
  revalidatePath("/admin/products");
  return { ok: true, message: "Stock adjusted" };
}

const transferSchema = z
  .object({
    productId: z.string().min(1, "Choose a product"),
    fromWarehouseId: z.string().min(1),
    toWarehouseId: z.string().min(1),
    quantity: z.coerce.number().int().min(1, "Quantity must be ≥ 1"),
    reason: z.string().optional(),
  })
  .refine((d) => d.fromWarehouseId !== d.toWarehouseId, {
    message: "Source and destination must differ",
    path: ["toWarehouseId"],
  });

export async function transferStockAction(_prev: State, formData: FormData): Promise<State> {
  const user = await requireRole("inventory_manager", "admin");
  const parsed = transferSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  try {
    await transferStock(d.productId, d.quantity, d.fromWarehouseId, d.toWarehouseId, {
      reason: d.reason || "Stock transfer",
      actorId: user.id,
    });
  } catch (err) {
    if (err instanceof InsufficientStockError) return { error: "Not enough stock at the source warehouse." };
    return { error: err instanceof Error ? err.message : "Transfer failed" };
  }
  revalidatePath("/admin/stock");
  return { ok: true, message: "Stock transferred" };
}

const warehouseSchema = z.object({
  name: z.string().min(2, "Name is required"),
  code: z.string().optional(),
  address: z.string().optional(),
});

export async function createWarehouseAction(_prev: State, formData: FormData): Promise<State> {
  await requireRole("inventory_manager", "admin");
  const parsed = warehouseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  const code = (d.code || slugify(d.name)).toUpperCase().slice(0, 12);
  const exists = await prisma.warehouse.findUnique({ where: { code } });
  if (exists) return { error: "A warehouse with that code already exists." };
  await prisma.warehouse.create({ data: { name: d.name, code, address: d.address || null } });
  revalidatePath("/admin/stock");
  return { ok: true, message: "Warehouse added" };
}
