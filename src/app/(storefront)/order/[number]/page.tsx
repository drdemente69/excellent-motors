import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { getOrderByNumber } from "@/lib/queries/orders";
import { OrderDetails } from "@/components/storefront/order-details";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order confirmed" };

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const order = await getOrderByNumber(number);
  if (!order) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="grid size-14 place-items-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="size-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold sm:text-3xl">Thank you for your order!</h1>
        <p className="mt-2 text-muted-foreground">
          A confirmation has been sent to {order.email}. Your order number is{" "}
          <span className="font-mono font-medium text-foreground">{order.orderNumber}</span>.
        </p>
        <div className="mt-5 flex gap-3">
          <Button asChild variant="outline">
            <Link href="/shop">Continue shopping</Link>
          </Button>
          <Button asChild>
            <Link href={`/track?order=${order.orderNumber}`}>Track order</Link>
          </Button>
        </div>
      </div>

      <OrderDetails order={order} />
    </div>
  );
}
