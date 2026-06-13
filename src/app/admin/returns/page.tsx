import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { formatPKR, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { ReturnsProcessor } from "@/components/admin/returns-processor";

export const dynamic = "force-dynamic";
export const metadata = { title: "Returns" };

export default async function ReturnsPage() {
  await requireRole("cashier", "inventory_manager", "admin");

  const returns = await prisma.return.findMany({
    include: {
      items: true,
      posSale: { select: { saleNumber: true } },
      order: { select: { orderNumber: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">Returns & exchanges</h1>
        <p className="text-sm text-muted-foreground">Process returns against a sale or order, with optional restock.</p>
      </div>

      <ReturnsProcessor />

      <div>
        <h2 className="mb-3 font-display font-semibold">Return history</h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Return</th>
                  <th className="px-4 py-3 font-medium">Against</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 text-center font-medium">Items</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3 font-mono">{r.returnNumber}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.posSale?.saleNumber ?? r.order?.orderNumber ?? "—"}</td>
                    <td className="px-4 py-3"><Badge variant={r.type === "refund" ? "warning" : "accent"}>{r.type}</Badge></td>
                    <td className="px-4 py-3 text-center">{r.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPKR(Number(r.refundAmount))}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDateTime(r.createdAt)}</td>
                  </tr>
                ))}
                {returns.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No returns yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
