import { Trash2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import {
  getFinanceSummary,
  getSalesTrend,
  getRecentExpenses,
} from "@/lib/queries/finance";
import { deleteExpense } from "@/app/admin/accounts/actions";
import { formatPKR, formatDateShort } from "@/lib/format";
import { SalesTrendChart } from "@/components/admin/charts";
import { ExpenseForm } from "@/components/admin/expense-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Accounts" };

export default async function AccountsPage() {
  await requireRole("accountant", "admin");
  const [pnl, trend, expenses] = await Promise.all([
    getFinanceSummary(),
    getSalesTrend(14),
    getRecentExpenses(50),
  ]);

  const pnlRows = [
    { label: "Gross sales", value: pnl.grossSales },
    { label: "Less: discounts", value: -pnl.discounts, dim: true },
    { label: "Less: refunds", value: -pnl.refundTotal, dim: true },
    { label: "Net sales", value: pnl.netSales, strong: true },
    { label: "Less: cost of goods sold", value: -pnl.cogs, dim: true },
    { label: "Gross profit", value: pnl.grossProfit, strong: true },
    { label: "Less: operating expenses", value: -pnl.operatingExpenses, dim: true },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Accounts</h1>
        <p className="text-sm text-muted-foreground">Income, expenses, cash flow and profit &amp; loss.</p>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Net sales" value={formatPKR(pnl.netSales)} icon={<TrendingUp className="size-4" />} tone="primary" />
        <Kpi label="Gross profit" value={formatPKR(pnl.grossProfit)} icon={<Wallet className="size-4" />} tone="accent" />
        <Kpi label="Expenses" value={formatPKR(pnl.operatingExpenses)} icon={<TrendingDown className="size-4" />} tone="warning" />
        <Kpi label="Net profit" value={formatPKR(pnl.netProfit)} icon={pnl.netProfit >= 0 ? <TrendingUp className="size-4" /> : <TrendingDown className="size-4" />} tone={pnl.netProfit >= 0 ? "success" : "destructive"} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Cash flow chart */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display font-semibold">Sales — last 14 days</h2>
          <SalesTrendChart data={trend} />
        </div>

        {/* P&L statement */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-display font-semibold">Profit &amp; loss</h2>
          <dl className="flex flex-col gap-2 text-sm">
            {pnlRows.map((r) => (
              <div key={r.label} className={`flex justify-between ${r.strong ? "border-t border-border pt-2 font-semibold" : ""}`}>
                <dt className={r.dim ? "text-muted-foreground" : ""}>{r.label}</dt>
                <dd className={r.value < 0 ? "text-muted-foreground" : ""}>{formatPKR(r.value)}</dd>
              </div>
            ))}
            <div className="mt-1 flex justify-between border-t-2 border-border pt-2 font-display text-base font-bold">
              <dt>Net profit</dt>
              <dd className={pnl.netProfit >= 0 ? "text-success" : "text-destructive"}>{formatPKR(pnl.netProfit)}</dd>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">GST collected (liability): {formatPKR(pnl.taxCollected)}</p>
          </dl>
        </div>
      </div>

      {/* Expenses */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display font-semibold">Record an expense</h2>
        <ExpenseForm />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <h2 className="border-b border-border p-5 font-display font-semibold">Expense history</h2>
        {expenses.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No expenses recorded yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Category</th><th className="px-5 py-3 font-medium">Description</th><th className="px-5 py-3 text-right font-medium">Amount</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-surface-2">
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{formatDateShort(e.date)}</td>
                  <td className="px-5 py-3 font-medium">{e.category}</td>
                  <td className="px-5 py-3 text-muted-foreground">{e.description ?? "—"}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatPKR(e.amount)}</td>
                  <td className="px-5 py-3 text-right">
                    <form action={deleteExpense}>
                      <input type="hidden" name="id" value={e.id} />
                      <button type="submit" className="text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="size-4" /></button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, tone }: { label: string; value: string; icon: React.ReactNode; tone: string }) {
  const tones: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
    warning: "bg-warning/15 text-warning",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className={`grid size-8 place-items-center rounded-lg ${tones[tone]}`}>{icon}</span>
      </div>
      <p className="mt-3 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}
