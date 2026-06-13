import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";
import { getPurchaseOrder } from "@/lib/queries/purchasing";
import { formatPKR, formatDateShort, formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { PO_STATUS_VARIANT } from "@/components/admin/po-status";
import { PoManage } from "@/components/admin/po-manage";

export const dynamic = "force-dynamic";
export const metadata = { title: "Purchase order" };

export default async function PoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const po = await getPurchaseOrder(id);
  if (!po) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/purchasing" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to purchasing
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-2xl font-bold tracking-tight">{po.poNumber}</h1>
            <Badge variant={PO_STATUS_VARIANT[po.status]}>{po.status.replace("_", " ")}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link href={`/admin/vendors/${po.vendor.id}`} className="text-primary hover:underline">{po.vendor.name}</Link>
            {" · "}Created {formatDateShort(po.createdAt)}
            {po.expectedAt ? ` · Expected ${formatDateShort(po.expectedAt)}` : ""}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {/* Items */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-4 py-3 font-medium">Product</th><th className="px-4 py-3 text-center font-medium">Ordered</th><th className="px-4 py-3 text-center font-medium">Received</th><th className="px-4 py-3 text-right font-medium">Unit cost</th><th className="px-4 py-3 text-right font-medium">Total</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {po.items.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-3"><p className="font-medium">{i.name}</p><p className="font-mono text-xs text-muted-foreground">{i.sku}</p></td>
                    <td className="px-4 py-3 text-center">{i.quantity}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={i.receivedQty >= i.quantity ? "success" : i.receivedQty > 0 ? "warning" : "secondary"}>{i.receivedQty}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{formatPKR(i.unitCost)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPKR(i.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border">
                  <td colSpan={4} className="px-4 py-3 text-right font-display font-semibold">Order total</td>
                  <td className="px-4 py-3 text-right font-display text-lg font-bold">{formatPKR(po.grandTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <PoManage po={{ id: po.id, status: po.status, grandTotal: po.grandTotal, amountPaid: po.amountPaid, items: po.items }} />
        </div>

        {/* GRN history */}
        <aside>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 font-display font-semibold"><FileText className="size-4 text-primary" /> Goods receipts</h2>
            {po.receipts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No goods received yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {po.receipts.map((g) => (
                  <li key={g.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs">{g.grnNumber}</span>
                      <span className="text-xs text-muted-foreground">{formatDateTime(g.createdAt)}</span>
                    </div>
                    <div className="mt-2 flex gap-3 text-xs">
                      <span className="text-success">+{g.good} good</span>
                      {g.damaged > 0 && <span className="text-warning">{g.damaged} damaged</span>}
                      {g.missing > 0 && <span className="text-destructive">{g.missing} missing</span>}
                    </div>
                    {g.note && <p className="mt-1 text-xs text-muted-foreground">{g.note}</p>}
                  </li>
                ))}
              </ul>
            )}
            {po.notes && (
              <div className="mt-4 border-t border-border pt-4 text-sm">
                <p className="text-xs font-medium text-muted-foreground">PO notes</p>
                <p className="mt-1 text-muted-foreground">{po.notes}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
