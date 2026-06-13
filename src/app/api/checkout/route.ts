import { NextResponse } from "next/server";
import { checkoutSchema } from "@/lib/validations/order";
import { placeOrder } from "@/lib/orders/service";
import { InsufficientStockError } from "@/lib/inventory/errors";
import { enforceRateLimit } from "@/lib/rate-limit";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "checkout", 30, 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const session = await auth();

  const shippingAddress =
    data.fulfillment === "delivery"
      ? [data.line1, data.line2, data.city, data.province, data.postalCode]
          .filter(Boolean)
          .join(", ")
      : undefined;

  try {
    const result = await placeOrder({
      items: data.items,
      customerName: data.customerName,
      email: data.email,
      phone: data.phone,
      fulfillment: data.fulfillment,
      paymentMethod: data.paymentMethod,
      shippingAddress,
      userId: session?.user?.id ?? null,
      notes: data.notes,
    });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return NextResponse.json(
        { error: "Sorry, one or more items just went out of stock. Please review your cart." },
        { status: 409 },
      );
    }
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
