import Link from "next/link";
import { Truck, Store } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import { getAdminOrders } from "@/lib/queries/orders";
import { formatPKR, formatDateTime } from "@/lib/format";
import { Badge, type BadgeProps } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Orders" };

const STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  placed: "warning",
  confirmed: "default",
  processing: "default",
  dispatched: "accent",
  delivered: "success",
  picked_up: "success",
  cancelled: "destructive",
};

const FILTERS = [
  { id: "", label: "All" },
  { id: "placed", label: "New" },
  { id: "confirmed", label: "Confirmed" },
  { id: "processing", label: "Processing" },
  { id: "dispatched", label: "Dispatched" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireRole("cashier", "inventory_manager", "admin");
  const sp = await searchParams;
  const orders = await getAdminOrders(sp.status || undefined);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Online orders</h1>
        <p className="text-sm text-muted-foreground">Fulfil web orders — advancing status notifies the customer.</p>
      </div>

      <div className="flex flex-wrap gap-1 text-sm">
        {FILTERS.map((f) => (
          <Link key={f.id} href={`/admin/orders${f.id ? `?status=${f.id}` : ""}`} className={`rounded-lg px-3 py-2 ${(sp.status ?? "") === f.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2"}`}>
            {f.label}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Fulfilment</th>
                <th className="px-4 py-3 text-center font-medium">Items</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-surface-2">
                  <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-mono text-primary hover:underline">{o.orderNumber}</Link></td>
                  <td className="px-4 py-3"><p className="font-medium">{o.customerName}</p><p className="text-xs text-muted-foreground">{o.email}</p></td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      {o.fulfillment === "pickup" ? <Store className="size-3.5" /> : <Truck className="size-3.5" />}
                      {o.fulfillment}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">{o.items.length}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatPKR(o.grandTotal)}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_VARIANT[o.status] ?? "secondary"}>{o.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDateTime(o.placedAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No orders found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
