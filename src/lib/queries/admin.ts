import { prisma } from "@/lib/db";
import type { Prisma, ProductStatus, StockMovementType } from "@prisma/client";

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getDashboardStats() {
  const since = startOfToday();
  const [posAgg, posCount, orderAgg, orderCount, productCount, invRows] =
    await Promise.all([
      prisma.posSale.aggregate({
        where: { status: "completed", createdAt: { gte: since } },
        _sum: { grandTotal: true },
      }),
      prisma.posSale.count({ where: { status: "completed", createdAt: { gte: since } } }),
      prisma.order.aggregate({
        where: { placedAt: { gte: since }, status: { not: "cancelled" } },
        _sum: { grandTotal: true },
      }),
      prisma.order.count({ where: { placedAt: { gte: since } } }),
      prisma.product.count({ where: { status: "active" } }),
      prisma.inventory.findMany({
        include: { product: { select: { cost: true } } },
      }),
    ]);

  const stockValue = invRows.reduce(
    (s, i) => s + i.quantity * Number(i.product.cost),
    0,
  );

  // Low stock: per-product on-hand vs reorder level.
  const byProduct = new Map<string, { qty: number; reorder: number }>();
  for (const i of invRows) {
    const cur = byProduct.get(i.productId) ?? { qty: 0, reorder: 0 };
    cur.qty += i.quantity;
    cur.reorder = Math.max(cur.reorder, i.reorderLevel);
    byProduct.set(i.productId, cur);
  }
  let lowStock = 0;
  let outOfStock = 0;
  for (const v of byProduct.values()) {
    if (v.qty <= 0) outOfStock += 1;
    else if (v.qty <= v.reorder) lowStock += 1;
  }

  return {
    posSalesToday: Number(posAgg._sum.grandTotal ?? 0),
    posCountToday: posCount,
    onlineSalesToday: Number(orderAgg._sum.grandTotal ?? 0),
    onlineCountToday: orderCount,
    productCount,
    stockValue,
    lowStock,
    outOfStock,
  };
}

export async function getLowStockProducts(limit = 50) {
  const inv = await prisma.inventory.findMany({
    include: { product: { include: { brand: true, category: true } } },
  });
  const byProduct = new Map<
    string,
    { product: (typeof inv)[number]["product"]; qty: number; reorder: number }
  >();
  for (const i of inv) {
    const cur = byProduct.get(i.productId) ?? { product: i.product, qty: 0, reorder: 0 };
    cur.qty += i.quantity;
    cur.reorder = Math.max(cur.reorder, i.reorderLevel);
    byProduct.set(i.productId, cur);
  }
  return Array.from(byProduct.values())
    .filter((v) => v.qty <= v.reorder)
    .sort((a, b) => a.qty - b.qty)
    .slice(0, limit)
    .map((v) => ({
      id: v.product.id,
      name: v.product.name,
      sku: v.product.sku,
      brand: v.product.brand?.name ?? null,
      category: v.product.category.name,
      qty: v.qty,
      reorder: v.reorder,
    }));
}

export async function getRecentSales(limit = 6) {
  const sales = await prisma.posSale.findMany({
    where: { status: "completed" },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return sales.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    total: Number(s.grandTotal),
    items: s.items.length,
    createdAt: s.createdAt.toISOString(),
  }));
}

export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  partNumber: string | null;
  brand: string | null;
  category: string;
  price: number;
  cost: number;
  status: ProductStatus;
  stock: number;
  reorder: number;
};

export async function getAdminProducts(opts: {
  q?: string;
  category?: string;
  status?: ProductStatus;
}): Promise<AdminProductRow[]> {
  const where: Prisma.ProductWhereInput = {};
  if (opts.q) {
    where.OR = [
      { name: { contains: opts.q, mode: "insensitive" } },
      { sku: { contains: opts.q, mode: "insensitive" } },
      { barcode: { contains: opts.q, mode: "insensitive" } },
      { partNumber: { contains: opts.q, mode: "insensitive" } },
    ];
  }
  if (opts.category) where.category = { slug: opts.category };
  if (opts.status) where.status = opts.status;

  const products = await prisma.product.findMany({
    where,
    include: { brand: true, category: true, inventory: true },
    orderBy: { createdAt: "desc" },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    barcode: p.barcode,
    partNumber: p.partNumber,
    brand: p.brand?.name ?? null,
    category: p.category.name,
    price: Number(p.price),
    cost: Number(p.cost),
    status: p.status,
    stock: p.inventory.reduce((s, i) => s + i.quantity, 0),
    reorder: p.inventory.reduce((m, i) => Math.max(m, i.reorderLevel), 0),
  }));
}

export async function getStockMovements(opts: {
  productId?: string;
  type?: StockMovementType;
  take?: number;
}) {
  const movements = await prisma.stockMovement.findMany({
    where: {
      ...(opts.productId ? { productId: opts.productId } : {}),
      ...(opts.type ? { type: opts.type } : {}),
    },
    include: { product: { select: { name: true, sku: true } } },
    orderBy: { createdAt: "desc" },
    take: opts.take ?? 100,
  });
  return movements.map((m) => ({
    id: m.id,
    productName: m.product.name,
    sku: m.product.sku,
    type: m.type,
    quantity: m.quantity,
    reason: m.reason,
    reference: m.reference,
    createdAt: m.createdAt.toISOString(),
  }));
}
