import type { FulfillmentType, OrderStatus, PaymentMethod } from "@prisma/client";
import { prisma } from "@/lib/db";
import { decreaseStock } from "@/lib/inventory/service";
import { getPaymentProvider } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { sendEmail, createNotification } from "@/lib/notify";
import { publish } from "@/lib/realtime/bus";
import { shortId } from "@/lib/utils";
import { formatPKR } from "@/lib/format";

export type PlaceOrderInput = {
  items: { productId: string; quantity: number }[];
  customerName: string;
  email: string;
  phone?: string;
  fulfillment: FulfillmentType;
  paymentMethod: PaymentMethod; // cod | mock_gateway | cash
  shippingAddress?: string;
  userId?: string | null;
  notes?: string;
};

export type PlaceOrderResult = {
  orderId: string;
  orderNumber: string;
  grandTotal: number;
};

const FREE_DELIVERY_THRESHOLD = 15000;
const DELIVERY_FEE = 300;

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (input.items.length === 0) throw new Error("Your cart is empty.");

  // 1. Re-fetch products from the DB — never trust client-supplied prices.
  const products = await prisma.product.findMany({
    where: { id: { in: input.items.map((i) => i.productId) }, status: "active" },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const lines = input.items.map((i) => {
    const p = byId.get(i.productId);
    if (!p) throw new Error("A product in your cart is no longer available.");
    const qty = Math.max(1, Math.floor(i.quantity));
    const unitPrice = Number(p.price);
    const taxRatePct = Number(p.taxRatePct);
    const lineTotal = unitPrice * qty;
    return { product: p, qty, unitPrice, taxRatePct, lineTotal };
  });

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const taxTotal = lines.reduce((s, l) => s + (l.lineTotal * l.taxRatePct) / 100, 0);
  const shippingTotal =
    input.fulfillment === "pickup" || subtotal >= FREE_DELIVERY_THRESHOLD
      ? 0
      : DELIVERY_FEE;
  const grandTotal = Math.round(subtotal + taxTotal + shippingTotal);

  const orderNumber = `EM-${new Date().getFullYear()}-${shortId(6)}`;

  // 2. Take payment for online gateways BEFORE touching stock.
  let paymentStatus: "paid" | "pending" = "pending";
  let paymentReference: string | null = null;
  let paymentProviderName: string | null = null;
  if (input.paymentMethod === "mock_gateway") {
    const provider = getPaymentProvider();
    const result = await provider.charge({
      orderRef: orderNumber,
      amount: grandTotal,
      customerName: input.customerName,
      customerEmail: input.email,
    });
    if (!result.success) throw new Error(result.message ?? "Payment failed.");
    paymentStatus = "paid";
    paymentReference = result.reference;
    paymentProviderName = result.provider;
  }
  // COD / cash settle later → status stays "pending" until fulfilled.

  // 3. Decrement stock atomically through the shared service (never oversell).
  //    Throws InsufficientStockError if any line lacks stock → no order created.
  await decreaseStock(
    lines.map((l) => ({ productId: l.product.id, quantity: l.qty })),
    { type: "online_order", reference: orderNumber, reason: "Online order", actorId: input.userId ?? undefined },
  );

  // 4. Persist the order, items, payment, first event + accounting entry.
  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        userId: input.userId ?? undefined,
        status: "placed",
        fulfillment: input.fulfillment,
        shippingAddress: input.shippingAddress,
        email: input.email,
        phone: input.phone,
        customerName: input.customerName,
        subtotal,
        taxTotal,
        shippingTotal,
        grandTotal,
        notes: input.notes,
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
          create: {
            method: input.paymentMethod,
            status: paymentStatus === "paid" ? "paid" : "pending",
            amount: grandTotal,
            reference: paymentReference,
            provider: paymentProviderName,
          },
        },
        events: { create: { status: "placed", note: "Order placed" } },
      },
    });

    // Double-entry-lite: record income when money is collected up-front.
    if (paymentStatus === "paid") {
      await tx.ledgerEntry.create({
        data: {
          type: "income",
          category: "online_sale",
          amount: grandTotal,
          reference: created.id,
          memo: `Online order ${orderNumber}`,
        },
      });
    }

    await tx.auditLog.create({
      data: {
        actorId: input.userId ?? undefined,
        action: "order.placed",
        entity: "Order",
        entityId: created.id,
        metadata: JSON.stringify({ orderNumber, grandTotal }),
      },
    });

    return created;
  });

  // 5. Broadcast + notify.
  publish({ type: "order.created", orderId: order.id, orderNumber });
  const settings = await getSettings();
  await sendEmail({
    to: input.email,
    subject: `Order ${orderNumber} confirmed — ${settings.businessName}`,
    body:
      `Hi ${input.customerName},\n\n` +
      `Thanks for your order. We've received it and it's now being processed.\n\n` +
      `Order: ${orderNumber}\n` +
      `Total: ${formatPKR(grandTotal)}\n` +
      `Fulfilment: ${input.fulfillment === "pickup" ? "In-store pickup" : "Delivery"}\n` +
      `Payment: ${input.paymentMethod === "cod" ? "Cash on delivery" : input.paymentMethod === "mock_gateway" ? "Paid online" : "Cash"}\n\n` +
      `Track your order at ${process.env.NEXT_PUBLIC_APP_URL}/track?order=${orderNumber}\n\n` +
      `— ${settings.businessName}`,
  });
  if (input.userId) {
    await createNotification({
      userId: input.userId,
      title: `Order ${orderNumber} placed`,
      body: `We received your order for ${formatPKR(grandTotal)}.`,
      link: `/account/orders/${order.id}`,
    });
  }

  return { orderId: order.id, orderNumber, grandTotal };
}

/** Advance an order through its status pipeline (used by back office + tracking). */
export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
  note?: string,
  actorId?: string,
) {
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status,
      events: { create: { status, note } },
    },
  });
  publish({ type: "order.updated", orderId, status });
  const pretty = status.replace("_", " ");
  if (order.userId) {
    await createNotification({
      userId: order.userId,
      title: `Order ${order.orderNumber} ${pretty}`,
      body: note ?? `Your order status is now ${pretty}.`,
      link: `/account/orders/${orderId}`,
    });
  }
  await sendEmail({
    to: order.email,
    subject: `Order ${order.orderNumber} — ${pretty}`,
    body:
      `Hi ${order.customerName},\n\n` +
      `Your order ${order.orderNumber} is now "${pretty}".\n` +
      (note ? `\n${note}\n` : "") +
      `\nTrack it: ${process.env.NEXT_PUBLIC_APP_URL}/track?order=${order.orderNumber}\n`,
  });
  return order;
}
