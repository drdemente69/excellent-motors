import type { PurchaseOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { increaseStock, getDefaultWarehouseId } from "@/lib/inventory/service";
import { shortId } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// Purchasing: vendors → purchase orders → goods receipts (GRN).
// Receiving goods restocks through the shared InventoryService
// (type "purchase_receipt"), so received stock is audited + broadcast live.
// ─────────────────────────────────────────────────────────────────────────────

export type PoLineInput = { productId: string; quantity: number; unitCost: number };

export async function createPurchaseOrder(input: {
  vendorId: string;
  items: PoLineInput[];
  warehouseId?: string;
  expectedAt?: Date | null;
  notes?: string;
  createdById?: string;
}) {
  const lines = input.items.filter((i) => i.quantity > 0);
  if (lines.length === 0) throw new Error("Add at least one line item.");

  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitCost, 0);
  const warehouseId = input.warehouseId ?? (await getDefaultWarehouseId());
  const poNumber = `PO-${new Date().getFullYear()}-${shortId(6)}`;

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      vendorId: input.vendorId,
      warehouseId,
      status: "draft",
      expectedAt: input.expectedAt ?? undefined,
      notes: input.notes,
      createdById: input.createdById,
      subtotal,
      taxTotal: 0,
      grandTotal: subtotal,
      items: {
        create: lines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitCost: l.unitCost,
          lineTotal: l.quantity * l.unitCost,
        })),
      },
    },
  });
  return po;
}

export async function setPurchaseOrderStatus(
  id: string,
  status: PurchaseOrderStatus,
) {
  return prisma.purchaseOrder.update({ where: { id }, data: { status } });
}

export type GrnLineInput = {
  purchaseOrderItemId: string;
  receivedQty: number; // good units → stock
  damagedQty: number;
  missingQty: number;
};

/**
 * Receive goods against a PO. Good units go into stock via the shared service;
 * damaged/missing are recorded for tracking. Updates PO line fulfilment, latest
 * product cost, and the PO status (partially_received / completed).
 */
export async function receiveGoods(input: {
  purchaseOrderId: string;
  lines: GrnLineInput[];
  note?: string;
  receivedById?: string;
}) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: input.purchaseOrderId },
    include: { items: true },
  });
  if (!po) throw new Error("Purchase order not found.");
  if (po.status === "cancelled") throw new Error("This PO was cancelled.");
  if (po.status === "completed") throw new Error("This PO is already fully received.");

  const grnNumber = `GRN-${new Date().getFullYear()}-${shortId(6)}`;
  const itemById = new Map(po.items.map((i) => [i.id, i]));

  const stockLines: { productId: string; quantity: number }[] = [];
  const grnItems: { purchaseOrderItemId: string; receivedQty: number; damagedQty: number; missingQty: number }[] = [];
  const poItemIncrements: { id: string; good: number; productId: string; unitCost: number }[] = [];

  for (const line of input.lines) {
    const poItem = itemById.get(line.purchaseOrderItemId);
    if (!poItem) continue;
    const remaining = poItem.quantity - poItem.receivedQty;
    const good = Math.max(0, Math.min(Math.floor(line.receivedQty), remaining));
    const damaged = Math.max(0, Math.floor(line.damagedQty));
    const missing = Math.max(0, Math.floor(line.missingQty));
    if (good === 0 && damaged === 0 && missing === 0) continue;
    grnItems.push({ purchaseOrderItemId: poItem.id, receivedQty: good, damagedQty: damaged, missingQty: missing });
    if (good > 0) {
      stockLines.push({ productId: poItem.productId, quantity: good });
      poItemIncrements.push({ id: poItem.id, good, productId: poItem.productId, unitCost: Number(poItem.unitCost) });
    }
  }

  if (grnItems.length === 0) throw new Error("Nothing to receive.");

  // Restock good units atomically through the shared service.
  if (stockLines.length > 0) {
    await increaseStock(stockLines, {
      type: "purchase_receipt",
      reference: grnNumber,
      reason: `Goods receipt for ${po.poNumber}`,
      actorId: input.receivedById,
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.goodsReceipt.create({
      data: {
        grnNumber,
        purchaseOrderId: po.id,
        warehouseId: po.warehouseId,
        status: "posted",
        receivedById: input.receivedById,
        note: input.note,
        items: { create: grnItems },
      },
    });

    for (const inc of poItemIncrements) {
      await tx.purchaseOrderItem.update({
        where: { id: inc.id },
        data: { receivedQty: { increment: inc.good } },
      });
      // Keep latest landed cost on the product.
      await tx.product.update({ where: { id: inc.productId }, data: { cost: inc.unitCost } });
    }

    // Recompute PO status from fulfilment.
    const fresh = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: po.id } });
    const fullyReceived = fresh.every((i) => i.receivedQty >= i.quantity);
    const anyReceived = fresh.some((i) => i.receivedQty > 0);
    const status: PurchaseOrderStatus = fullyReceived ? "completed" : anyReceived ? "partially_received" : po.status;
    await tx.purchaseOrder.update({ where: { id: po.id }, data: { status } });

    await tx.auditLog.create({
      data: { actorId: input.receivedById, action: "po.receive", entity: "GoodsReceipt", entityId: po.id, metadata: JSON.stringify({ grnNumber, poNumber: po.poNumber }) },
    });
  });

  return { grnNumber };
}

export async function recordPoPayment(poId: string, amount: number, actorId?: string) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  if (!po) throw new Error("PO not found.");
  const newPaid = Math.min(Number(po.grandTotal), Number(po.amountPaid) + Math.max(0, amount));
  await prisma.purchaseOrder.update({ where: { id: poId }, data: { amountPaid: newPaid } });
  await prisma.auditLog.create({
    data: { actorId, action: "po.payment", entity: "PurchaseOrder", entityId: poId, metadata: JSON.stringify({ amount, newPaid }) },
  });
  return { paid: newPaid };
}
