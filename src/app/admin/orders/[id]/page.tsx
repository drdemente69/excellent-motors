import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import { getOrderById } from "@/lib/queries/orders";
import { OrderDetails } from "@/components/storefront/order-details";
import { OrderStatusControl } from "@/components/admin/order-status-control";

export const dynamic = "force-dynamic";
export const metadata = { title: "Order" };

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("cashier", "inventory_manager", "admin");
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to orders
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="order-2 lg:order-1">
          <OrderDetails order={order} />
        </div>

        <aside className="order-1 flex flex-col gap-4 lg:order-2">
          <OrderStatusControl orderId={order.id} status={order.status} fulfillment={order.fulfillment} />
          <div className="rounded-xl border border-border bg-card p-5 text-sm">
            <h2 className="mb-2 font-display font-semibold">Customer</h2>
            <p className="font-medium">{order.customerName}</p>
            <a href={`mailto:${order.email}`} className="mt-1 flex items-center gap-2 text-muted-foreground hover:text-primary"><Mail className="size-4" /> {order.email}</a>
            {order.phone && <a href={`tel:${order.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary"><Phone className="size-4" /> {order.phone}</a>}
          </div>
        </aside>
      </div>
    </div>
  );
}
