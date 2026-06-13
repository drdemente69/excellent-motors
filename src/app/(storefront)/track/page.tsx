import { PackageSearch } from "lucide-react";
import { getOrderByNumber } from "@/lib/queries/orders";
import { OrderDetails } from "@/components/storefront/order-details";
import { TrackForm } from "@/components/storefront/track-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Track your order" };

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  const order = orderNumber ? await getOrderByNumber(orderNumber) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="mb-8 max-w-xl">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">Track your order</h1>
        <p className="mt-2 text-muted-foreground">
          Enter your order number to see live status updates.
        </p>
        <div className="mt-5">
          <TrackForm initial={orderNumber ?? ""} />
        </div>
      </div>

      {orderNumber && !order && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6 text-muted-foreground">
          <PackageSearch className="size-5" />
          No order found for <span className="font-mono text-foreground">{orderNumber}</span>. Please check the number and try again.
        </div>
      )}

      {order && <OrderDetails order={order} />}
    </div>
  );
}
