import type { ReturnType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { increaseStock } from "@/lib/inventory/service";
import { publish } from "@/lib/realtime/bus";
import { shortId } from "@/lib/utils";

// Returns & exchanges. Restocking goes back through the shared InventoryService
// (type "return_in") so the storefront sees the units come back live.

export type ReturnLineInput = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type ProcessReturnInput = {
  orderId?: string;
  posSaleId?: string;
  items: ReturnLineInput[];
  type: ReturnType; // refund | exchange
  reason?: string;
  restock: boolean;
  processedById?: string;
};

export async function processReturn(input: ProcessReturnInput) {
  if (input.items.length === 0) throw new Error("Select at least one item to return.");
  if (!input.orderId && !input.posSaleId)
    throw new Error("A return must reference a sale or an order.");

  const refundAmount = input.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const returnNumber = `RET-${new Date().getFullYear()}-${shortId(6)}`;

  // Put stock back first (atomic, audited) if restocking.
  if (input.restock) {
    await increaseStock(
      input.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      { type: "return_in", reference: returnNumber, reason: `Return ${input.type}`, actorId: input.processedById },
    );
  }

  const ret = await prisma.$transaction(async (tx) => {
    const created = await tx.return.create({
      data: {
        returnNumber,
        type: input.type,
        status: "completed",
        orderId: input.orderId,
        posSaleId: input.posSaleId,
        reason: input.reason,
        refundAmount,
        processedById: input.processedById,
        items: {
          create: input.items.map((i) => ({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
          })),
        },
      },
    });

    // Refunds reduce income (recorded as an expense entry for P&L accuracy).
    if (input.type === "refund" && refundAmount > 0) {
      await tx.ledgerEntry.create({
        data: { type: "expense", category: "refund", amount: refundAmount, reference: created.id, memo: `Refund ${returnNumber}` },
      });
    }
    await tx.auditLog.create({
      data: { actorId: input.processedById, action: "return.processed", entity: "Return", entityId: created.id, metadata: JSON.stringify({ returnNumber, refundAmount, type: input.type }) },
    });
    return created;
  });

  publish({ type: "order.updated", orderId: input.orderId ?? ret.id, status: "returned" });
  return { id: ret.id, returnNumber, refundAmount };
}
