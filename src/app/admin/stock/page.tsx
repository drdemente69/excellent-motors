import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { StockMovementType } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  getStockMovements,
  getLowStockProducts,
  getAdminProducts,
} from "@/lib/queries/admin";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import {
  StockAdjustForm,
  StockTransferForm,
  WarehouseForm,
} from "@/components/admin/stock-forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Stock" };

const TABS = [
  { id: "movements", label: "Movements" },
  { id: "alerts", label: "Alerts" },
  { id: "adjust", label: "Adjust" },
  { id: "transfer", label: "Transfer" },
];

const MOVEMENT_LABEL: Record<string, string> = {
  initial: "Opening",
  sale: "POS sale",
  online_order: "Online order",
  purchase_receipt: "Purchase",
  adjustment: "Adjustment",
  transfer: "Transfer",
  return_in: "Return in",
  return_out: "Return out",
};

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const tab = sp.tab ?? "movements";

  const [movements, alerts, products, warehouses] = await Promise.all([
    getStockMovements({ type: sp.type as StockMovementType | undefined, take: 150 }),
    getLowStockProducts(100),
    getAdminProducts({}),
    prisma.warehouse.findMany({ orderBy: { isDefault: "desc" } }),
  ]);

  const productOpts = products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, stock: p.stock }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Stock management</h1>
        <p className="text-sm text-muted-foreground">Adjustments, transfers, alerts and the full movement ledger.</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/stock?tab=${t.id}`}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
            {t.id === "alerts" && alerts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-warning/15 px-1.5 py-0.5 text-xs text-warning">{alerts.length}</span>
            )}
          </Link>
        ))}
      </div>

      {tab === "movements" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-right font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Reason / Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-surface-2">
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">{formatDateTime(m.createdAt)}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{m.productName}</p>
                      <p className="font-mono text-xs text-muted-foreground">{m.sku}</p>
                    </td>
                    <td className="px-4 py-3"><Badge variant="secondary">{MOVEMENT_LABEL[m.type] ?? m.type}</Badge></td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 font-mono font-medium ${m.quantity < 0 ? "text-destructive" : "text-success"}`}>
                        {m.quantity < 0 ? <ArrowDownRight className="size-3.5" /> : <ArrowUpRight className="size-3.5" />}
                        {m.quantity > 0 ? "+" : ""}{m.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {m.reason}{m.reference ? <span className="font-mono text-xs"> · {m.reference}</span> : ""}
                    </td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No movements yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "alerts" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {alerts.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Everything is well stocked. 🎉</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 text-center font-medium">On hand</th>
                  <th className="px-4 py-3 text-center font-medium">Reorder at</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {alerts.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3"><p className="font-medium">{p.name}</p><p className="font-mono text-xs text-muted-foreground">{p.sku}</p></td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}</td>
                    <td className="px-4 py-3 text-center"><Badge variant={p.qty <= 0 ? "destructive" : "warning"}>{p.qty}</Badge></td>
                    <td className="px-4 py-3 text-center text-muted-foreground">{p.reorder}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/stock?tab=adjust`} className="text-sm font-medium text-primary hover:underline">Restock</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === "adjust" && (
        <div>
          <p className="mb-4 text-sm text-muted-foreground">Set the on-hand quantity directly. The signed difference is recorded as a movement.</p>
          <StockAdjustForm products={productOpts} />
        </div>
      )}

      {tab === "transfer" && (
        <div className="flex flex-col gap-8">
          <div>
            <h2 className="mb-3 font-display font-semibold">Transfer between warehouses</h2>
            <StockTransferForm products={productOpts} warehouses={warehouses.map((w) => ({ id: w.id, name: w.name }))} />
          </div>
          <div>
            <h2 className="mb-3 font-display font-semibold">Warehouses ({warehouses.length})</h2>
            <div className="mb-4 flex flex-wrap gap-2">
              {warehouses.map((w) => (
                <Badge key={w.id} variant="secondary">{w.name} · {w.code}</Badge>
              ))}
            </div>
            <WarehouseForm />
          </div>
        </div>
      )}
    </div>
  );
}
