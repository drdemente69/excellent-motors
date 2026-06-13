"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth-helpers";
import {
  createPurchaseOrder,
  setPurchaseOrderStatus,
  receiveGoods,
  recordPoPayment,
  type PoLineInput,
  type GrnLineInput,
} from "@/lib/purchasing/service";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function createPurchaseOrderAction(input: {
  vendorId: string;
  items: PoLineInput[];
  expectedAt?: string;
  notes?: string;
}): Promise<Result<{ id: string; poNumber: string }>> {
  const user = await requireRole("inventory_manager", "admin");
  try {
    if (!input.vendorId) throw new Error("Select a vendor.");
    const po = await createPurchaseOrder({
      vendorId: input.vendorId,
      items: input.items,
      expectedAt: input.expectedAt ? new Date(input.expectedAt) : null,
      notes: input.notes,
      createdById: user.id,
    });
    revalidatePath("/admin/purchasing");
    return { ok: true, data: { id: po.id, poNumber: po.poNumber } };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create PO" };
  }
}

export async function setPoStatusAction(id: string, status: "sent" | "cancelled"): Promise<void> {
  await requireRole("inventory_manager", "admin");
  await setPurchaseOrderStatus(id, status);
  revalidatePath(`/admin/purchasing/${id}`);
  revalidatePath("/admin/purchasing");
}

export async function receiveGoodsAction(input: {
  purchaseOrderId: string;
  lines: GrnLineInput[];
  note?: string;
}): Promise<Result<{ grnNumber: string }>> {
  const user = await requireRole("inventory_manager", "admin");
  try {
    const res = await receiveGoods({ ...input, receivedById: user.id });
    revalidatePath(`/admin/purchasing/${input.purchaseOrderId}`);
    revalidatePath("/admin/purchasing");
    revalidatePath("/admin/stock");
    return { ok: true, data: res };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Receiving failed" };
  }
}

export async function recordPaymentAction(poId: string, amount: number): Promise<Result<{ paid: number }>> {
  const user = await requireRole("inventory_manager", "accountant", "admin");
  try {
    const res = await recordPoPayment(poId, amount, user.id);
    revalidatePath(`/admin/purchasing/${poId}`);
    revalidatePath("/admin/vendors");
    return { ok: true, data: res };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Payment failed" };
  }
}
