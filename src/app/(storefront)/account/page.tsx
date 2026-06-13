import Link from "next/link";
import { Package, Clock, ArrowRight, ShoppingBag } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getUserOrders } from "@/lib/queries/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPKR, formatDateShort } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata = { title: "My account" };

export default async function AccountOverview() {
  const user = await requireUser();
  const orders = await getUserOrders(user.id);
  const active = orders.filter((o) => !["delivered", "picked_up", "cancelled"].includes(o.status));
  const recent = orders.slice(0, 4);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Welcome back{user.name ? `, ${user.name.split(" ")[0]}` : ""} 👋
        </h1>
        <p className="mt-1 text-muted-foreground">Here&apos;s a snapshot of your account.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={<Package className="size-5" />} value={orders.length} label="Total orders" />
        <StatCard icon={<Clock className="size-5" />} value={active.length} label="In progress" />
        <StatCard
          icon={<ShoppingBag className="size-5" />}
          value={formatPKR(orders.reduce((s, o) => s + o.grandTotal, 0))}
          label="Lifetime spend"
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display font-semibold">Recent orders</h2>
          <Link href="/account/orders" className="inline-flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all">
            View all <ArrowRight className="size-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">You haven&apos;t placed any orders yet.</p>
            <Button asChild className="mt-4"><Link href="/shop">Start shopping</Link></Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((o) => (
              <li key={o.id}>
                <Link href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-4 py-3 transition-colors hover:text-primary">
                  <div>
                    <p className="font-mono text-sm">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(o.placedAt)} · {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{o.status.replace("_", " ")}</Badge>
                    <span className="text-sm font-medium">{formatPKR(o.grandTotal)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <span className="text-primary">{icon}</span>
      <p className="mt-3 font-display text-xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
