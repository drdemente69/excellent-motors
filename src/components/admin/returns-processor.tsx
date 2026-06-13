"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Minus, Plus, RotateCcw, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { findSaleOrOrder, processReturnAction } from "@/app/admin/returns/actions";

type FoundSale = {
  kind: "pos" | "order";
  id: string;
  number: string;
  customer: string | null;
  total: number;
  items: { productId: string; name: string; sku: string; quantity: number; unitPrice: number }[];
};

export function ReturnsProcessor() {
  const router = useRouter();
  const [number, setNumber] = useState("");
  const [finding, setFinding] = useState(false);
  const [sale, setSale] = useState<FoundSale | null>(null);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [type, setType] = useState<"refund" | "exchange">("refund");
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [processing, setProcessing] = useState(false);

  async function find() {
    if (!number.trim()) return;
    setFinding(true);
    const res = await findSaleOrOrder(number);
    setFinding(false);
    if (!res.ok) {
      setSale(null);
      toast.error(res.error);
      return;
    }
    setSale(res.data);
    setQty(Object.fromEntries(res.data.items.map((i) => [i.productId, 0])));
  }

  function setItemQty(item: FoundSale["items"][number], q: number) {
    setQty((m) => ({ ...m, [item.productId]: Math.max(0, Math.min(item.quantity, q)) }));
  }

  const refundAmount = sale
    ? sale.items.reduce((s, i) => s + i.unitPrice * (qty[i.productId] ?? 0), 0)
    : 0;
  const anySelected = Object.values(qty).some((q) => q > 0);

  async function process() {
    if (!sale || !anySelected) return;
    setProcessing(true);
    const items = sale.items
      .filter((i) => (qty[i.productId] ?? 0) > 0)
      .map((i) => ({ productId: i.productId, name: i.name, quantity: qty[i.productId], unitPrice: i.unitPrice }));
    const res = await processReturnAction({ kind: sale.kind, refId: sale.id, items, type, reason: reason || undefined, restock });
    setProcessing(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Return ${res.returnNumber} processed (${formatPKR(res.refundAmount)})`);
    setSale(null);
    setNumber("");
    setReason("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="font-display font-semibold">Process a return</h2>
      <p className="mt-1 text-sm text-muted-foreground">Look up a POS sale (POS-…) or online order (EM-…).</p>

      <form
        onSubmit={(e) => { e.preventDefault(); find(); }}
        className="mt-4 flex max-w-md gap-2"
      >
        <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="POS-2026-AB12CD" className="font-mono" />
        <Button type="submit" disabled={finding}>
          {finding ? <Loader2 className="animate-spin" /> : <Search />} Find
        </Button>
      </form>

      {sale && (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg bg-surface-2 p-3 text-sm">
            <span>
              <Badge variant={sale.kind === "pos" ? "default" : "accent"}>{sale.kind === "pos" ? "POS sale" : "Online order"}</Badge>
              <span className="ml-2 font-mono">{sale.number}</span>
              {sale.customer && <span className="ml-2 text-muted-foreground">· {sale.customer}</span>}
            </span>
            <span className="font-medium">{formatPKR(sale.total)}</span>
          </div>

          <ul className="flex flex-col gap-2">
            {sale.items.map((i) => (
              <li key={i.productId} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{formatPKR(i.unitPrice)} · sold {i.quantity}</p>
                </div>
                <div className="flex items-center rounded-md border border-border">
                  <button type="button" onClick={() => setItemQty(i, (qty[i.productId] ?? 0) - 1)} className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"><Minus className="size-3.5" /></button>
                  <span className="w-9 text-center text-sm font-medium">{qty[i.productId] ?? 0}</span>
                  <button type="button" onClick={() => setItemQty(i, (qty[i.productId] ?? 0) + 1)} className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"><Plus className="size-3.5" /></button>
                </div>
              </li>
            ))}
          </ul>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Type</Label>
              <div className="flex rounded-lg border border-border p-0.5">
                {(["refund", "exchange"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setType(t)} className={cn("flex-1 rounded-md px-3 py-2 text-sm capitalize", type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{t}</button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rreason">Reason</Label>
              <Input id="rreason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Faulty, wrong part, etc." />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={restock} onChange={(e) => setRestock(e.target.checked)} className="size-4 accent-[var(--primary)]" />
            Return items to stock
          </label>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground">{type === "refund" ? "Refund amount" : "Exchange value"}</p>
              <p className="font-display text-xl font-bold">{formatPKR(refundAmount)}</p>
            </div>
            <Button disabled={!anySelected || processing} onClick={process} size="lg">
              {processing ? <Loader2 className="animate-spin" /> : <RotateCcw />} Process return
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
