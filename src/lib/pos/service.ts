import { prisma } from "@/lib/db";
import { decreaseStock } from "@/lib/inventory/service";
import { publish } from "@/lib/realtime/bus";
import { shortId } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────────────────────
// POS sales. Identical stock discipline to online orders: every completed sale
// decrements stock atomically through the shared InventoryService (type "sale")
// and broadcasts, so the storefront updates the instant a counter sale happens.
// Held sales do NOT touch stock until completed.
// ─────────────────────────────────────────────────────────────────────────────

export type SaleLineInput = { productId: string; quantity: number };
export type PaymentInput = { method: "cash" | "card"; amount: number };

export type CompleteSaleInput = {
  items: SaleLineInput[];
  payments: PaymentInput[];
  orderDiscount?: number;
  customerName?: string;
  customerPhone?: string;
  cashierId?: string;
};

async function priceLines(items: SaleLineInput[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
  });
  const byId = new Map(products.map((p) => [p.id, p]));
  return items.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new Error("A product in the cart no longer exists.");
    const qty = Math.max(1, Math.floor(i.quantity));
    const unitPrice = Number(p.price);
    const taxRatePct = Number(p.taxRatePct);
    const lineTotal = unitPrice * qty;
    return { product: p, qty, unitPrice, taxRatePct, lineTotal };
  });
}

export async function completeSale(input: CompleteSaleInput) {
  if (input.items.length === 0) throw new Error("Cart is empty.");
  const lines = await priceLines(input.items);

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxTotal = lines.reduce((s, l) => s + (l.lineTotal * l.taxRatePct) / 100, 0);
  const discountTotal = Math.min(Math.max(0, input.orderDiscount ?? 0), subtotal);
  const grandTotal = Math.round(subtotal + taxTotal - discountTotal);

  const paid = input.payments.reduce((s, p) => s + p.amount, 0);
  if (paid + 0.5 < grandTotal) {
    throw new Error("Payment is less than the amount due.");
  }

  const saleNumber = `POS-${new Date().getFullYear()}-${shortId(6)}`;

  // Atomic stock decrement (never oversell). Throws → no sale recorded.
  await decreaseStock(
    lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
    { type: "sale", reference: saleNumber, reason: "POS sale", actorId: input.cashierId },
  );

  const sale = await prisma.$transaction(async (tx) => {
    const created = await tx.posSale.create({
      data: {
        saleNumber,
        cashierId: input.cashierId,
        status: "completed",
        subtotal,
        taxTotal,
        discountTotal,
        grandTotal,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        items: {
          create: lines.map((l) => ({
            productId: l.product.id,
            name: l.product.name,
            sku: l.product.sku,
            unitPrice: l.unitPrice,
            taxRatePct: l.taxRatePct,
            quantity: l.qty,
            lineTotal: l.lineTotal,
          })),
        },
        payments: {
          create: input.payments.map((p) => ({
            method: p.method,
            status: "paid",
            amount: p.amount,
          })),
        },
      },
    });

    await tx.ledgerEntry.create({
      data: { type: "income", category: "pos_sale", amount: grandTotal, reference: created.id, memo: `POS sale ${saleNumber}` },
    });
    await tx.auditLog.create({
      data: { actorId: input.cashierId, action: "pos.sale", entity: "PosSale", entityId: created.id, metadata: JSON.stringify({ saleNumber, grandTotal }) },
    });
    return created;
  });

  publish({ type: "pos.sale", saleId: sale.id, saleNumber });

  const change = Math.max(0, paid - grandTotal);
  return { saleId: sale.id, saleNumber, grandTotal, paid, change, subtotal, taxTotal, discountTotal };
}

/** Park the current cart for later (no stock movement). */
export async function holdSale(input: {
  items: SaleLineInput[];
  label: string;
  customerName?: string;
  cashierId?: string;
}) {
  const lines = await priceLines(input.items);
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxTotal = lines.reduce((s, l) => s + (l.lineTotal * l.taxRatePct) / 100, 0);

  const sale = await prisma.posSale.create({
    data: {
      saleNumber: `HOLD-${shortId(6)}`,
      cashierId: input.cashierId,
      status: "held",
      heldLabel: input.label,
      customerName: input.customerName,
      subtotal,
      taxTotal,
      grandTotal: Math.round(subtotal + taxTotal),
      items: {
        create: lines.map((l) => ({
          productId: l.product.id,
          name: l.product.name,
          sku: l.product.sku,
          unitPrice: l.unitPrice,
          taxRatePct: l.taxRatePct,
          quantity: l.qty,
          lineTotal: l.lineTotal,
        })),
      },
    },
  });
  return { id: sale.id, label: input.label };
}

export async function listHeldSales(cashierId?: string) {
  const rows = await prisma.posSale.findMany({
    where: { status: "held", ...(cashierId ? { cashierId } : {}) },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => ({
    id: r.id,
    label: r.heldLabel ?? r.saleNumber,
    createdAt: r.createdAt.toISOString(),
    itemCount: r.items.length,
    total: Number(r.grandTotal),
    items: r.items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
  }));
}

/** Remove a held sale (after recalling it into the cart, or discarding it). */
export async function discardHeldSale(id: string) {
  await prisma.posSale.deleteMany({ where: { id, status: "held" } });
}
