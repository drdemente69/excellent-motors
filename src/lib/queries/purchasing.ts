import { prisma } from "@/lib/db";
import { getLowStockProducts } from "@/lib/queries/admin";

export async function getVendors() {
  const vendors = await prisma.vendor.findMany({
    orderBy: { name: "asc" },
    include: { purchaseOrders: { select: { grandTotal: true, amountPaid: true, status: true } } },
  });
  return vendors.map((v) => {
    const orders = v.purchaseOrders.filter((p) => p.status !== "cancelled");
    const total = orders.reduce((s, p) => s + Number(p.grandTotal), 0);
    const paid = orders.reduce((s, p) => s + Number(p.amountPaid), 0);
    return {
      id: v.id,
      name: v.name,
      code: v.code,
      contactName: v.contactName,
      email: v.email,
      phone: v.phone,
      isActive: v.isActive,
      poCount: orders.length,
      totalPurchased: total,
      outstanding: total - paid,
    };
  });
}

export async function getVendor(id: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      purchaseOrders: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });
  if (!vendor) return null;
  return {
    ...vendor,
    purchaseOrders: vendor.purchaseOrders.map((po) => ({
      id: po.id,
      poNumber: po.poNumber,
      status: po.status,
      grandTotal: Number(po.grandTotal),
      amountPaid: Number(po.amountPaid),
      createdAt: po.createdAt.toISOString(),
      itemCount: po.items.length,
    })),
  };
}

export async function getPurchaseOrders(status?: string) {
  const pos = await prisma.purchaseOrder.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { createdAt: "desc" },
    include: { vendor: { select: { name: true } }, items: true },
  });
  return pos.map((po) => {
    const ordered = po.items.reduce((s, i) => s + i.quantity, 0);
    const received = po.items.reduce((s, i) => s + i.receivedQty, 0);
    return {
      id: po.id,
      poNumber: po.poNumber,
      vendor: po.vendor.name,
      status: po.status,
      grandTotal: Number(po.grandTotal),
      amountPaid: Number(po.amountPaid),
      createdAt: po.createdAt.toISOString(),
      expectedAt: po.expectedAt?.toISOString() ?? null,
      ordered,
      received,
    };
  });
}

export async function getPurchaseOrder(id: string) {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      vendor: true,
      items: { include: { product: { select: { name: true, sku: true } } } },
      receipts: {
        orderBy: { createdAt: "desc" },
        include: { items: true },
      },
    },
  });
  if (!po) return null;
  return {
    id: po.id,
    poNumber: po.poNumber,
    status: po.status,
    notes: po.notes,
    createdAt: po.createdAt.toISOString(),
    expectedAt: po.expectedAt?.toISOString() ?? null,
    subtotal: Number(po.subtotal),
    grandTotal: Number(po.grandTotal),
    amountPaid: Number(po.amountPaid),
    vendor: { id: po.vendor.id, name: po.vendor.name, code: po.vendor.code, phone: po.vendor.phone, email: po.vendor.email },
    items: po.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      name: i.product.name,
      sku: i.product.sku,
      quantity: i.quantity,
      receivedQty: i.receivedQty,
      unitCost: Number(i.unitCost),
      lineTotal: Number(i.lineTotal),
    })),
    receipts: po.receipts.map((g) => ({
      id: g.id,
      grnNumber: g.grnNumber,
      createdAt: g.createdAt.toISOString(),
      note: g.note,
      good: g.items.reduce((s, it) => s + it.receivedQty, 0),
      damaged: g.items.reduce((s, it) => s + it.damagedQty, 0),
      missing: g.items.reduce((s, it) => s + it.missingQty, 0),
    })),
  };
}

/** Low-stock products with a suggested reorder qty, for one-click PO creation. */
export async function getReorderSuggestions() {
  const low = await getLowStockProducts(100);
  return low.map((p) => ({
    ...p,
    suggested: Math.max(p.reorder * 2 - p.qty, p.reorder),
  }));
}
