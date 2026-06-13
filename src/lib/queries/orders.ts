import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

const orderInclude = {
  items: true,
  events: { orderBy: { createdAt: "asc" } },
  payments: true,
} satisfies Prisma.OrderInclude;

type OrderWith = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

export type SerializedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  fulfillment: string;
  customerName: string;
  email: string;
  phone: string | null;
  shippingAddress: string | null;
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  grandTotal: number;
  placedAt: string;
  items: {
    id: string;
    name: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
  }[];
  events: { status: string; note: string | null; createdAt: string }[];
  payments: { method: string; status: string; amount: number; reference: string | null }[];
};

function serialize(o: OrderWith): SerializedOrder {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    fulfillment: o.fulfillment,
    customerName: o.customerName,
    email: o.email,
    phone: o.phone,
    shippingAddress: o.shippingAddress,
    subtotal: Number(o.subtotal),
    taxTotal: Number(o.taxTotal),
    shippingTotal: Number(o.shippingTotal),
    discountTotal: Number(o.discountTotal),
    grandTotal: Number(o.grandTotal),
    placedAt: o.placedAt.toISOString(),
    items: o.items.map((i) => ({
      id: i.id,
      name: i.name,
      sku: i.sku,
      unitPrice: Number(i.unitPrice),
      quantity: i.quantity,
      lineTotal: Number(i.lineTotal),
    })),
    events: o.events.map((e) => ({
      status: e.status,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
    payments: o.payments.map((p) => ({
      method: p.method,
      status: p.status,
      amount: Number(p.amount),
      reference: p.reference,
    })),
  };
}

export async function getOrderByNumber(orderNumber: string) {
  const o = await prisma.order.findUnique({
    where: { orderNumber },
    include: orderInclude,
  });
  return o ? serialize(o) : null;
}

export async function getOrderById(id: string) {
  const o = await prisma.order.findUnique({ where: { id }, include: orderInclude });
  return o ? serialize(o) : null;
}

export async function getUserOrders(userId: string) {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: orderInclude,
    orderBy: { placedAt: "desc" },
  });
  return orders.map(serialize);
}

/** All online orders for the back-office fulfilment queue. */
export async function getAdminOrders(status?: string) {
  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : {},
    include: orderInclude,
    orderBy: { placedAt: "desc" },
    take: 100,
  });
  return orders.map(serialize);
}

/** Count of orders still needing fulfilment action (for dashboards/badges). */
export async function getOpenOrderCount() {
  return prisma.order.count({
    where: { status: { in: ["placed", "confirmed", "processing"] } },
  });
}
