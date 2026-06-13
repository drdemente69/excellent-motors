import Link from "next/link";
import {
  ScanLine,
  ShoppingCart,
  Package,
  AlertTriangle,
  Boxes,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import {
  getDashboardStats,
  getLowStockProducts,
  getRecentSales,
} from "@/lib/queries/admin";
import { getOpenOrderCount } from "@/lib/queries/orders";
import { formatPKR, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const [stats, lowStock, recentSales, openOrders] = await Promise.all([
    getDashboardStats(),
    getLowStockProducts(6),
    getRecentSales(6),
    getOpenOrderCount(),
  ]);

  const kpis = [
    { label: "POS sales today", value: formatPKR(stats.posSalesToday), sub: `${stats.posCountToday} sale${stats.posCountToday !== 1 ? "s" : ""}`, icon: ScanLine },
    { label: "Online sales today", value: formatPKR(stats.onlineSalesToday), sub: `${stats.onlineCountToday} order${stats.onlineCountToday !== 1 ? "s" : ""}`, icon: ShoppingCart },
    { label: "Active products", value: String(stats.productCount), sub: `Stock value ${formatPKR(stats.stockValue)}`, icon: Package },
    { label: "Stock alerts", value: String(stats.lowStock + stats.outOfStock), sub: `${stats.outOfStock} out · ${stats.lowStock} low`, icon: AlertTriangle, alert: stats.lowStock + stats.outOfStock > 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Live overview of sales, stock and activity.</p>
        </div>
        <Button asChild>
          <Link href="/pos"><ScanLine /> Open POS</Link>
        </Button>
      </div>

      {openOrders > 0 && (
        <Link href="/admin/orders?status=placed" className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3.5 transition-colors hover:bg-primary/10">
          <span className="flex items-center gap-2.5 text-sm font-medium">
            <ShoppingCart className="size-4 text-primary" />
            {openOrders} online order{openOrders !== 1 ? "s" : ""} awaiting fulfilment
          </span>
          <span className="inline-flex items-center gap-1 text-sm text-primary">Fulfil now <ArrowRight className="size-4" /></span>
        </Link>
      )}

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{k.label}</span>
              <span className={`grid size-8 place-items-center rounded-lg ${k.alert ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary"}`}>
                <k.icon className="size-4" />
              </span>
            </div>
            <p className="mt-3 font-display text-2xl font-bold">{k.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low stock */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display font-semibold">
              <AlertTriangle className="size-4 text-warning" /> Low / out of stock
            </h2>
            <Link href="/admin/stock?tab=alerts" className="inline-flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all">
              Manage <ArrowRight className="size-4" />
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Everything is well stocked. 🎉</p>
          ) : (
            <ul className="divide-y divide-border">
              {lowStock.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.sku}</p>
                  </div>
                  <Badge variant={p.qty <= 0 ? "destructive" : "warning"}>
                    {p.qty} left · reorder {p.reorder}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent POS sales */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display font-semibold">
              <TrendingUp className="size-4 text-success" /> Recent POS sales
            </h2>
            <Link href="/admin/stock" className="inline-flex items-center gap-1 text-sm text-primary hover:gap-2 transition-all">
              Stock log <ArrowRight className="size-4" />
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <div className="py-8 text-center">
              <Boxes className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">No sales yet today. Open the POS to make one.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {recentSales.map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div>
                    <p className="font-mono text-sm">{s.saleNumber}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(s.createdAt)} · {s.items} item{s.items !== 1 ? "s" : ""}</p>
                  </div>
                  <span className="text-sm font-semibold">{formatPKR(s.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
