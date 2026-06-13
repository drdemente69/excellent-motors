import Link from "next/link";
import { Plus, AlertTriangle, PackageCheck } from "lucide-react";
import { getPurchaseOrders, getReorderSuggestions } from "@/lib/queries/purchasing";
import { formatPKR, formatDateShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PO_STATUS_VARIANT } from "@/components/admin/po-status";

export const dynamic = "force-dynamic";
export const metadata = { title: "Purchasing" };

const STATUSES = [
  { id: "", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "partially_received", label: "Partial" },
  { id: "completed", label: "Completed" },
];

export default async function PurchasingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const [orders, suggestions] = await Promise.all([
    getPurchaseOrders(sp.status || undefined),
    getReorderSuggestions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Purchasing</h1>
          <p className="text-sm text-muted-foreground">Create and track purchase orders, receive goods.</p>
        </div>
        <Button asChild><Link href="/admin/purchasing/new"><Plus /> New purchase order</Link></Button>
      </div>

      {/* Reorder suggestions */}
      {suggestions.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-5">
          <h2 className="flex items-center gap-2 font-display font-semibold">
            <AlertTriangle className="size-4 text-warning" /> Suggested reorders ({suggestions.length})
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">Products at or below their reorder level. Start a PO to restock.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.slice(0, 8).map((s) => (
              <span key={s.id} className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">{s.qty} left · order ~{s.suggested}</span>
              </span>
            ))}
          </div>
          <Button asChild size="sm" variant="secondary" className="mt-3"><Link href="/admin/purchasing/new">Create PO</Link></Button>
        </div>
      )}

      {/* Status filter */}
      <div className="flex flex-wrap gap-1 text-sm">
        {STATUSES.map((s) => (
          <Link key={s.id} href={`/admin/purchasing${s.id ? `?status=${s.id}` : ""}`} className={`rounded-lg px-3 py-2 ${(sp.status ?? "") === s.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2"}`}>
            {s.label}
          </Link>
        ))}
      </div>

      {/* PO table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">PO</th>
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Received</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders.map((po) => (
                <tr key={po.id} className="hover:bg-surface-2">
                  <td className="px-4 py-3"><Link href={`/admin/purchasing/${po.id}`} className="font-mono text-primary hover:underline">{po.poNumber}</Link></td>
                  <td className="px-4 py-3">{po.vendor}</td>
                  <td className="px-4 py-3"><Badge variant={PO_STATUS_VARIANT[po.status]}>{po.status.replace("_", " ")}</Badge></td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <PackageCheck className="size-3.5" /> {po.received}/{po.ordered}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatPKR(po.grandTotal)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">{formatDateShort(po.createdAt)}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No purchase orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
