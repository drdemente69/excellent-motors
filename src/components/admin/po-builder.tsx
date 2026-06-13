"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPKR } from "@/lib/format";
import { createPurchaseOrderAction } from "@/app/admin/purchasing/actions";

type ProductOpt = { id: string; name: string; sku: string; cost: number };
type VendorOpt = { id: string; name: string };
type Row = { productId: string; name: string; sku: string; quantity: number; unitCost: number };

const selectCls =
  "h-11 w-full rounded-lg border border-input bg-surface px-3.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

export function PoBuilder({
  vendors,
  products,
  initialVendorId,
}: {
  vendors: VendorOpt[];
  products: ProductOpt[];
  initialVendorId?: string;
}) {
  const router = useRouter();
  const [vendorId, setVendorId] = useState(initialVendorId ?? vendors[0]?.id ?? "");
  const [expectedAt, setExpectedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [addId, setAddId] = useState("");
  const [saving, setSaving] = useState(false);

  function addRow() {
    const p = products.find((x) => x.id === addId);
    if (!p) return;
    if (rows.some((r) => r.productId === p.id)) {
      toast.error("That product is already on the order.");
      return;
    }
    setRows((r) => [...r, { productId: p.id, name: p.name, sku: p.sku, quantity: 1, unitCost: p.cost }]);
    setAddId("");
  }

  function update(productId: string, patch: Partial<Row>) {
    setRows((r) => r.map((x) => (x.productId === productId ? { ...x, ...patch } : x)));
  }

  const subtotal = rows.reduce((s, r) => s + r.quantity * r.unitCost, 0);

  async function submit() {
    if (!vendorId) return toast.error("Select a vendor.");
    if (rows.length === 0) return toast.error("Add at least one product.");
    setSaving(true);
    const res = await createPurchaseOrderAction({
      vendorId,
      items: rows.map((r) => ({ productId: r.productId, quantity: r.quantity, unitCost: r.unitCost })),
      expectedAt: expectedAt || undefined,
      notes: notes || undefined,
    });
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Created ${res.data.poNumber}`);
    router.push(`/admin/purchasing/${res.data.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label>Vendor</Label>
          <select value={vendorId} onChange={(e) => setVendorId(e.target.value)} className={selectCls}>
            {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expectedAt">Expected date</Label>
          <Input id="expectedAt" type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Input id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-end gap-2 border-b border-border p-4">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label>Add product</Label>
            <select value={addId} onChange={(e) => setAddId(e.target.value)} className={selectCls}>
              <option value="">Select a product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>
          <Button onClick={addRow} disabled={!addId} variant="secondary"><Plus /> Add</Button>
        </div>

        {rows.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">No line items yet. Add products above.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Qty</th>
                <th className="px-4 py-3 font-medium">Unit cost</th>
                <th className="px-4 py-3 text-right font-medium">Line total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.productId}>
                  <td className="px-4 py-3"><p className="font-medium">{r.name}</p><p className="font-mono text-xs text-muted-foreground">{r.sku}</p></td>
                  <td className="px-4 py-3"><Input type="number" min={1} value={r.quantity} onChange={(e) => update(r.productId, { quantity: Math.max(1, Number(e.target.value)) })} className="h-9 w-20" /></td>
                  <td className="px-4 py-3"><Input type="number" min={0} step="0.01" value={r.unitCost} onChange={(e) => update(r.productId, { unitCost: Math.max(0, Number(e.target.value)) })} className="h-9 w-28" /></td>
                  <td className="px-4 py-3 text-right font-medium">{formatPKR(r.quantity * r.unitCost)}</td>
                  <td className="px-4 py-3 text-right"><button onClick={() => setRows((rs) => rs.filter((x) => x.productId !== r.productId))} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
        <div>
          <p className="text-xs text-muted-foreground">Order total</p>
          <p className="font-display text-2xl font-bold">{formatPKR(subtotal)}</p>
        </div>
        <Button size="lg" onClick={submit} disabled={saving || rows.length === 0}>
          {saving ? <Loader2 className="animate-spin" /> : <FileText />} Create PO
        </Button>
      </div>
    </div>
  );
}
