import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getUserOrders } from "@/lib/queries/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getUserOrders(user.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Order history</h1>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Package className="mx-auto size-10 text-muted-foreground" />
          <p className="mt-4 text-sm text-muted-foreground">No orders yet.</p>
          <Button asChild className="mt-4"><Link href="/shop">Browse parts</Link></Button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-medium">Order</th>
                <th className="hidden px-5 py-3 font-medium sm:table-cell">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 text-right font-medium">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((o) => (
                <tr key={o.id} className="transition-colors hover:bg-surface-2">
                  <td className="px-5 py-4">
                    <p className="font-mono">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{o.items.length} item{o.items.length !== 1 ? "s" : ""}</p>
                  </td>
                  <td className="hidden px-5 py-4 text-muted-foreground sm:table-cell">{formatDateShort(o.placedAt)}</td>
                  <td className="px-5 py-4">
                    <Badge variant="secondary">{o.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-5 py-4 text-right font-medium">{formatPKR(o.grandTotal)}</td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/account/orders/${o.id}`} className="text-sm font-medium text-primary hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
