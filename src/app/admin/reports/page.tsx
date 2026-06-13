import { requireRole } from "@/lib/auth-helpers";
import {
  getFinanceSummary,
  getSalesTrend,
  getSalesByCategory,
  getTopProducts,
  getExpenseBreakdown,
} from "@/lib/queries/finance";
import { getDashboardStats } from "@/lib/queries/admin";
import { formatPKR } from "@/lib/format";
import { SalesTrendChart, CategoryBarChart, DonutChart, ChartLegend } from "@/components/admin/charts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requireRole("accountant", "admin");
  const [pnl, trend, byCategory, top, expenses, stats] = await Promise.all([
    getFinanceSummary(),
    getSalesTrend(30),
    getSalesByCategory(),
    getTopProducts(8),
    getExpenseBreakdown(),
    getDashboardStats(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Reports &amp; analytics</h1>
        <p className="text-sm text-muted-foreground">Business performance at a glance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Mini label="Net sales" value={formatPKR(pnl.netSales)} />
        <Mini label="Gross profit" value={formatPKR(pnl.grossProfit)} />
        <Mini label="Net profit" value={formatPKR(pnl.netProfit)} tone={pnl.netProfit >= 0 ? "text-success" : "text-destructive"} />
        <Mini label="Transactions" value={String(pnl.salesCount)} />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display font-semibold">Sales — last 30 days</h2>
        <SalesTrendChart data={trend} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display font-semibold">Sales by category</h2>
          {byCategory.length === 0 ? <Empty /> : <CategoryBarChart data={byCategory} />}
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display font-semibold">Top products</h2>
          {top.length === 0 ? <Empty /> : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="pb-2 font-medium">Product</th><th className="pb-2 text-center font-medium">Qty</th><th className="pb-2 text-right font-medium">Revenue</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {top.map((p) => (
                  <tr key={p.name}>
                    <td className="py-2.5 font-medium">{p.name}</td>
                    <td className="py-2.5 text-center text-muted-foreground">{p.qty}</td>
                    <td className="py-2.5 text-right font-medium">{formatPKR(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display font-semibold">Expense breakdown</h2>
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <DonutChart data={expenses} />
            {expenses.length > 0 && <ChartLegend data={expenses} />}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display font-semibold">Inventory analysis</h2>
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Stock value (cost)" value={formatPKR(stats.stockValue)} />
            <Stat label="Active products" value={String(stats.productCount)} />
            <Stat label="Low stock" value={String(stats.lowStock)} tone="text-warning" />
            <Stat label="Out of stock" value={String(stats.outOfStock)} tone="text-destructive" />
          </div>
          <p className="mt-4 text-xs text-muted-foreground">GST collected (payable): {formatPKR(pnl.taxCollected)}</p>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-2 font-display text-2xl font-bold ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-surface-2 p-4">
      <p className={`font-display text-xl font-bold ${tone ?? ""}`}>{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Empty() {
  return <p className="py-12 text-center text-sm text-muted-foreground">No data yet.</p>;
}
