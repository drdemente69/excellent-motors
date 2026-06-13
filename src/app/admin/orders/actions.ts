"use server";

import { revalidatePath } from "next/cache";
import type { OrderStatus } from "@prisma/client";
import { requireRole } from "@/lib/auth-helpers";
import { updateOrderStatus } from "@/lib/orders/service";

type Result = { ok: true } | { ok: false; error: string };

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus,
  note?: string,
): Promise<Result> {
  const user = await requireRole("cashier", "inventory_manager", "admin");
  try {
    await updateOrderStatus(orderId, status, note, user.id);
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not update status" };
  }
}
