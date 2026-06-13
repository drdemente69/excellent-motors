import type { Prisma, StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { publish } from "@/lib/realtime/bus";
import { InsufficientStockError } from "@/lib/inventory/errors";

// ─────────────────────────────────────────────────────────────────────────────
// InventoryService — the ONE place stock is allowed to change.
//
// Hard guarantees (per the brief, §6):
//   • Every mutation writes a signed StockMovement (full audit trail).
//   • Decrements are atomic at the DB level and can NEVER drive stock below 0.
//   • Every change broadcasts on the realtime bus so storefront + POS stay live.
//
// No feature may touch the Inventory table directly — always go through here.
// ─────────────────────────────────────────────────────────────────────────────

export type StockLine = {
  productId: string;
  quantity: number; // positive count of units moving
  warehouseId?: string; // defaults to the default warehouse
};

export type MovementMeta = {
  type: StockMovementType;
  reason?: string;
  reference?: string;
  actorId?: string;
};

let cachedDefaultWarehouseId: string | null = null;

export async function getDefaultWarehouseId(): Promise<string> {
  if (cachedDefaultWarehouseId) return cachedDefaultWarehouseId;
  const wh =
    (await prisma.warehouse.findFirst({ where: { isDefault: true } })) ??
    (await prisma.warehouse.findFirst());
  if (!wh)
    throw new Error("No warehouse configured. Run the seed script first.");
  cachedDefaultWarehouseId = wh.id;
  return wh.id;
}

/** Available units (on-hand minus reserved) per product, keyed by productId. */
export async function getAvailability(
  productIds: string[],
): Promise<Record<string, number>> {
  if (productIds.length === 0) return {};
  const rows = await prisma.inventory.groupBy({
    by: ["productId"],
    where: { productId: { in: productIds } },
    _sum: { quantity: true, reserved: true },
  });
  const map: Record<string, number> = {};
  for (const id of productIds) map[id] = 0;
  for (const r of rows) {
    map[r.productId] = (r._sum.quantity ?? 0) - (r._sum.reserved ?? 0);
  }
  return map;
}

export async function getAvailableForProduct(
  productId: string,
): Promise<number> {
  return (await getAvailability([productId]))[productId] ?? 0;
}

/**
 * Remove stock atomically (sale, online order, transfer-out).
 * Runs all lines in ONE transaction: if any line lacks stock, everything rolls
 * back, so an order can't partially deplete inventory.
 */
export async function decreaseStock(lines: StockLine[], meta: MovementMeta) {
  const warehouseId = await getDefaultWarehouseId();

  await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      if (line.quantity <= 0) continue;
      const wh = line.warehouseId ?? warehouseId;

      // Atomic, conditional decrement — the WHERE clause is the never-negative
      // guard. Two concurrent sales race here and exactly one wins per unit.
      const res = await tx.inventory.updateMany({
        where: { productId: line.productId, warehouseId: wh, quantity: { gte: line.quantity } },
        data: { quantity: { decrement: line.quantity } },
      });

      if (res.count === 0) {
        const current = await tx.inventory.findUnique({
          where: { productId_warehouseId: { productId: line.productId, warehouseId: wh } },
          select: { quantity: true, reserved: true },
        });
        throw new InsufficientStockError(
          line.productId,
          line.quantity,
          current ? current.quantity - current.reserved : 0,
        );
      }

      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          warehouseId: wh,
          type: meta.type,
          quantity: -line.quantity,
          reason: meta.reason,
          reference: meta.reference,
          actorId: meta.actorId,
        },
      });
    }
  });

  await broadcastLines(lines, warehouseId);
}

/** Add stock (purchase receipt, return, adjustment up, transfer-in). */
export async function increaseStock(lines: StockLine[], meta: MovementMeta) {
  const warehouseId = await getDefaultWarehouseId();

  await prisma.$transaction(async (tx) => {
    for (const line of lines) {
      if (line.quantity <= 0) continue;
      const wh = line.warehouseId ?? warehouseId;
      await upsertIncrement(tx, line.productId, wh, line.quantity);
      await tx.stockMovement.create({
        data: {
          productId: line.productId,
          warehouseId: wh,
          type: meta.type,
          quantity: line.quantity,
          reason: meta.reason,
          reference: meta.reference,
          actorId: meta.actorId,
        },
      });
    }
  });

  await broadcastLines(lines, warehouseId);
}

/**
 * Manual adjustment to an absolute on-hand quantity (stock-take / correction).
 * Records the signed delta as a movement.
 */
export async function adjustStock(
  productId: string,
  newQuantity: number,
  meta: Omit<MovementMeta, "type">,
  warehouseId?: string,
) {
  const wh = warehouseId ?? (await getDefaultWarehouseId());
  await prisma.$transaction(async (tx) => {
    const inv = await tx.inventory.upsert({
      where: { productId_warehouseId: { productId, warehouseId: wh } },
      create: { productId, warehouseId: wh, quantity: Math.max(0, newQuantity) },
      update: {},
      select: { quantity: true },
    });
    const delta = Math.max(0, newQuantity) - inv.quantity;
    if (delta !== 0) {
      await tx.inventory.update({
        where: { productId_warehouseId: { productId, warehouseId: wh } },
        data: { quantity: Math.max(0, newQuantity) },
      });
      await tx.stockMovement.create({
        data: {
          productId,
          warehouseId: wh,
          type: "adjustment",
          quantity: delta,
          reason: meta.reason ?? "Manual adjustment",
          reference: meta.reference,
          actorId: meta.actorId,
        },
      });
    }
  });
  await broadcastLines([{ productId, quantity: 0, warehouseId: wh }], wh);
}

/** Move stock between two warehouses atomically. */
export async function transferStock(
  productId: string,
  quantity: number,
  fromWarehouseId: string,
  toWarehouseId: string,
  meta: Omit<MovementMeta, "type">,
) {
  await decreaseStock([{ productId, quantity, warehouseId: fromWarehouseId }], {
    type: "transfer",
    reason: meta.reason ?? "Transfer out",
    reference: meta.reference,
    actorId: meta.actorId,
  });
  await increaseStock([{ productId, quantity, warehouseId: toWarehouseId }], {
    type: "transfer",
    reason: meta.reason ?? "Transfer in",
    reference: meta.reference,
    actorId: meta.actorId,
  });
}

// ── internals ───────────────────────────────────────────────────────────────

async function upsertIncrement(
  tx: Prisma.TransactionClient,
  productId: string,
  warehouseId: string,
  qty: number,
) {
  await tx.inventory.upsert({
    where: { productId_warehouseId: { productId, warehouseId } },
    create: { productId, warehouseId, quantity: qty },
    update: { quantity: { increment: qty } },
  });
}

/** After a committed change, push fresh availability + low-stock alerts. */
async function broadcastLines(lines: StockLine[], defaultWarehouseId: string) {
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const [products, availability] = await Promise.all([
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, sku: true, name: true },
    }),
    getAvailability(productIds),
  ]);
  const invRows = await prisma.inventory.findMany({
    where: { productId: { in: productIds } },
    select: { productId: true, quantity: true, reorderLevel: true },
  });
  const reorderByProduct = new Map<string, number>();
  const qtyByProduct = new Map<string, number>();
  for (const r of invRows) {
    reorderByProduct.set(r.productId, Math.max(reorderByProduct.get(r.productId) ?? 0, r.reorderLevel));
    qtyByProduct.set(r.productId, (qtyByProduct.get(r.productId) ?? 0) + r.quantity);
  }

  for (const p of products) {
    const available = availability[p.id] ?? 0;
    publish({
      type: "stock.changed",
      productId: p.id,
      warehouseId: defaultWarehouseId,
      quantity: qtyByProduct.get(p.id) ?? available,
      available,
      sku: p.sku,
    });
    const reorder = reorderByProduct.get(p.id) ?? 0;
    if (available <= reorder) {
      publish({
        type: "stock.low",
        productId: p.id,
        sku: p.sku,
        name: p.name,
        available,
        reorderLevel: reorder,
      });
    }
  }
}
