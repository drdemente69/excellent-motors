import { prisma } from "@/lib/db";

// Financial analytics shared by the Accounts and Reports modules.
// P&L is computed on ex-tax amounts; GST collected is shown separately as a
// liability. COGS uses current product cost (no historical cost snapshot).

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getFinanceSummary(from?: Date, to?: Date) {
  const posWhere = { status: "completed" as const, ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) };
  const orderWhere = { status: { not: "cancelled" as const }, ...(from || to ? { placedAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {}) };
  const retWhere = from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};
  const expWhere = from || to ? { date: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } } : {};

  const [pos, orders, posItems, orderItems, refunds, expenses, posCount, orderCount] = await Promise.all([
    prisma.posSale.aggregate({ where: posWhere, _sum: { subtotal: true, discountTotal: true, taxTotal: true, grandTotal: true } }),
    prisma.order.aggregate({ where: orderWhere, _sum: { subtotal: true, discountTotal: true, taxTotal: true, grandTotal: true } }),
    prisma.posSaleItem.findMany({ where: { posSale: posWhere }, include: { product: { select: { cost: true } } } }),
    prisma.orderItem.findMany({ where: { order: orderWhere }, include: { product: { select: { cost: true } } } }),
    prisma.return.aggregate({ where: retWhere, _sum: { refundAmount: true } }),
    prisma.expense.aggregate({ where: expWhere, _sum: { amount: true } }),
    prisma.posSale.count({ where: posWhere }),
    prisma.order.count({ where: orderWhere }),
  ]);

  const grossSales = Number(pos._sum.subtotal ?? 0) + Number(orders._sum.subtotal ?? 0);
  const discounts = Number(pos._sum.discountTotal ?? 0) + Number(orders._sum.discountTotal ?? 0);
  const taxCollected = Number(pos._sum.taxTotal ?? 0) + Number(orders._sum.taxTotal ?? 0);
  const refundTotal = Number(refunds._sum.refundAmount ?? 0);
  const netSales = grossSales - discounts - refundTotal;
  const cogs =
    posItems.reduce((s, i) => s + i.quantity * Number(i.product.cost), 0) +
    orderItems.reduce((s, i) => s + i.quantity * Number(i.product.cost), 0);
  const grossProfit = netSales - cogs;
  const operatingExpenses = Number(expenses._sum.amount ?? 0);
  const netProfit = grossProfit - operatingExpenses;

  return {
    grossSales,
    discounts,
    refundTotal,
    netSales,
    cogs,
    grossProfit,
    operatingExpenses,
    netProfit,
    taxCollected,
    salesCount: posCount + orderCount,
    grandCollected: Number(pos._sum.grandTotal ?? 0) + Number(orders._sum.grandTotal ?? 0),
  };
}

/** Sales total per day for the last `days` (POS + online), for a trend chart. */
export async function getSalesTrend(days = 14) {
  const since = daysAgo(days - 1);
  const [pos, orders] = await Promise.all([
    prisma.posSale.findMany({ where: { status: "completed", createdAt: { gte: since } }, select: { createdAt: true, grandTotal: true } }),
    prisma.order.findMany({ where: { status: { not: "cancelled" }, placedAt: { gte: since } }, select: { placedAt: true, grandTotal: true } }),
  ]);

  const map = new Map<string, { pos: number; online: number }>();
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    map.set(d.toISOString().slice(0, 10), { pos: 0, online: 0 });
  }
  for (const s of pos) {
    const k = s.createdAt.toISOString().slice(0, 10);
    if (map.has(k)) map.get(k)!.pos += Number(s.grandTotal);
  }
  for (const o of orders) {
    const k = o.placedAt.toISOString().slice(0, 10);
    if (map.has(k)) map.get(k)!.online += Number(o.grandTotal);
  }
  return Array.from(map.entries()).map(([date, v]) => ({
    date: new Date(date).toLocaleDateString("en-PK", { day: "2-digit", month: "short" }),
    pos: Math.round(v.pos),
    online: Math.round(v.online),
    total: Math.round(v.pos + v.online),
  }));
}

export async function getSalesByCategory() {
  const [posItems, orderItems] = await Promise.all([
    prisma.posSaleItem.findMany({ where: { posSale: { status: "completed" } }, include: { product: { include: { category: true } } } }),
    prisma.orderItem.findMany({ where: { order: { status: { not: "cancelled" } } }, include: { product: { include: { category: true } } } }),
  ]);
  const map = new Map<string, number>();
  for (const i of [...posItems, ...orderItems]) {
    const name = i.product.category.name;
    map.set(name, (map.get(name) ?? 0) + Number(i.lineTotal));
  }
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);
}

export async function getTopProducts(limit = 8) {
  const [posItems, orderItems] = await Promise.all([
    prisma.posSaleItem.findMany({ where: { posSale: { status: "completed" } } }),
    prisma.orderItem.findMany({ where: { order: { status: { not: "cancelled" } } } }),
  ]);
  const map = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const i of [...posItems, ...orderItems]) {
    const cur = map.get(i.productId) ?? { name: i.name, qty: 0, revenue: 0 };
    cur.qty += i.quantity;
    cur.revenue += Number(i.lineTotal);
    map.set(i.productId, cur);
  }
  return Array.from(map.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((p) => ({ ...p, revenue: Math.round(p.revenue) }));
}

export async function getExpenseBreakdown() {
  const rows = await prisma.expense.groupBy({ by: ["category"], _sum: { amount: true } });
  return rows
    .map((r) => ({ name: r.category, value: Math.round(Number(r._sum.amount ?? 0)) }))
    .sort((a, b) => b.value - a.value);
}

export async function getRecentExpenses(limit = 50) {
  const rows = await prisma.expense.findMany({ orderBy: { date: "desc" }, take: limit });
  return rows.map((e) => ({
    id: e.id,
    category: e.category,
    description: e.description,
    amount: Number(e.amount),
    date: e.date.toISOString(),
  }));
}
