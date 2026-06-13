"use server";

import { revalidatePath } from "next/cache";
import type { ReturnType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { processReturn, type ReturnLineInput } from "@/lib/returns/service";

type FoundSale = {
  kind: "pos" | "order";
  id: string;
  number: string;
  customer: string | null;
  total: number;
  items: { productId: string; name: string; sku: string; quantity: number; unitPrice: number }[];
};

type FindResult = { ok: true; data: FoundSale } | { ok: false; error: string };

/** Look up a POS sale (POS-…) or online order (EM-…) by its number. */
export async function findSaleOrOrder(numberRaw: string): Promise<FindResult> {
  await requireRole("cashier", "inventory_manager", "admin");
  const number = numberRaw.trim();
  if (!number) return { ok: false, error: "Enter a sale or order number." };

  const sale = await prisma.posSale.findUnique({ where: { saleNumber: number }, include: { items: true } });
  if (sale) {
    return {
      ok: true,
      data: {
        kind: "pos",
        id: sale.id,
        number: sale.saleNumber,
        customer: sale.customerName,
        total: Number(sale.grandTotal),
        items: sale.items.map((i) => ({ productId: i.productId, name: i.name, sku: i.sku, quantity: i.quantity, unitPrice: Number(i.unitPrice) })),
      },
    };
  }

  const order = await prisma.order.findUnique({ where: { orderNumber: number }, include: { items: true } });
  if (order) {
    return {
      ok: true,
      data: {
        kind: "order",
        id: order.id,
        number: order.orderNumber,
        customer: order.customerName,
        total: Number(order.grandTotal),
        items: order.items.map((i) => ({ productId: i.productId, name: i.name, sku: i.sku, quantity: i.quantity, unitPrice: Number(i.unitPrice) })),
      },
    };
  }

  return { ok: false, error: "No sale or order found with that number." };
}

export async function processReturnAction(input: {
  kind: "pos" | "order";
  refId: string;
  items: ReturnLineInput[];
  type: ReturnType;
  reason?: string;
  restock: boolean;
}): Promise<{ ok: true; returnNumber: string; refundAmount: number } | { ok: false; error: string }> {
  const user = await requireRole("cashier", "inventory_manager", "admin");
  try {
    const res = await processReturn({
      posSaleId: input.kind === "pos" ? input.refId : undefined,
      orderId: input.kind === "order" ? input.refId : undefined,
      items: input.items,
      type: input.type,
      reason: input.reason,
      restock: input.restock,
      processedById: user.id,
    });
    revalidatePath("/admin/returns");
    return { ok: true, returnNumber: res.returnNumber, refundAmount: res.refundAmount };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Return failed" };
  }
}
