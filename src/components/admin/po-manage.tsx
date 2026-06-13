"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send, Ban, PackageCheck, Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPKR } from "@/lib/format";
import {
  setPoStatusAction,
  receiveGoodsAction,
  recordPaymentAction,
} from "@/app/admin/purchasing/actions";

type PoItem = { id: string; name: string; sku: string; quantity: number; receivedQty: number; unitCost: number };
type Po = {
  id: string;
  status: string;
  grandTotal: number;
  amountPaid: number;
  items: PoItem[];
};

export function PoManage({ po }: { po: Po }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [recv, setRecv] = useState<Record<string, { received: number; damaged: number; missing: number }>>(
    Object.fromEntries(po.items.map((i) => [i.id, { received: Math.max(0, i.quantity - i.receivedQty), damaged: 0, missing: 0 }])),
  );

  const outstanding = po.grandTotal - po.amountPaid;
  const canReceive = ["draft", "sent", "partially_received"].includes(po.status);
  const openItems = po.items.filter((i) => i.quantity - i.receivedQty > 0);

  async function setStatus(status: "sent" | "cancelled") {
    setBusy(true);
    await setPoStatusAction(po.id, status);
    setBusy(false);
    toast.success(status === "sent" ? "PO marked as sent" : "PO cancelled");
    router.refresh();
  }

  async function receive() {
    const lines = po.items
      .map((i) => ({ purchaseOrderItemId: i.id, ...recv[i.id] }))
      .map((l) => ({ purchaseOrderItemId: l.purchaseOrderItemId, receivedQty: l.received || 0, damagedQty: l.damaged || 0, missingQty: l.missing || 0 }))
      .filter((l) => l.receivedQty > 0 || l.damagedQty > 0 || l.missingQty > 0);
    if (lines.length === 0) return toast.error("Enter quantities to receive.");
    setBusy(true);
    const res = await receiveGoodsAction({ purchaseOrderId: po.id, lines, note: note || undefined });
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Goods received — ${res.data.grnNumber}`);
    setNote("");
    router.refresh();
  }

  async function pay() {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return toast.error("Enter an amount.");
    setBusy(true);
    const res = await recordPaymentAction(po.id, amount);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Payment recorded (${formatPKR(res.data.paid)} total)`);
    setPayAmount("");
    router.refresh();
  }

  function setField(id: string, field: "received" | "damaged" | "missing", value: number) {
    setRecv((r) => ({ ...r, [id]: { ...r[id], [field]: Math.max(0, value) } }));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Status actions */}
      {po.status !== "cancelled" && po.status !== "completed" && (
        <div className="flex flex-wrap gap-2">
          {po.status === "draft" && (
            <Button onClick={() => setStatus("sent")} disabled={busy}><Send /> Mark as sent</Button>
          )}
          <Button onClick={() => setStatus("cancelled")} disabled={busy} variant="outline"><Ban /> Cancel PO</Button>
        </div>
      )}

      {/* Receive goods */}
      {canReceive && openItems.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display font-semibold"><PackageCheck className="size-4 text-primary" /> Receive goods</h2>
          <p className="mt-1 text-sm text-muted-foreground">Enter good, damaged and missing quantities. Good units are added to stock via a GRN.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="py-2 pr-4 font-medium">Product</th><th className="py-2 px-2 font-medium">Remaining</th><th className="py-2 px-2 font-medium">Received</th><th className="py-2 px-2 font-medium">Damaged</th><th className="py-2 px-2 font-medium">Missing</th></tr>
              </thead>
              <tbody>
                {openItems.map((i) => {
                  const remaining = i.quantity - i.receivedQty;
                  return (
                    <tr key={i.id} className="border-t border-border">
                      <td className="py-2 pr-4"><p className="font-medium">{i.name}</p><p className="font-mono text-xs text-muted-foreground">{i.sku}</p></td>
                      <td className="py-2 px-2 text-muted-foreground">{remaining}</td>
                      <td className="py-2 px-2"><Input type="number" min={0} max={remaining} value={recv[i.id]?.received ?? 0} onChange={(e) => setField(i.id, "received", Number(e.target.value))} className="h-9 w-20" /></td>
                      <td className="py-2 px-2"><Input type="number" min={0} value={recv[i.id]?.damaged ?? 0} onChange={(e) => setField(i.id, "damaged", Number(e.target.value))} className="h-9 w-20" /></td>
                      <td className="py-2 px-2"><Input type="number" min={0} value={recv[i.id]?.missing ?? 0} onChange={(e) => setField(i.id, "missing", Number(e.target.value))} className="h-9 w-20" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-1 flex-col gap-1.5">
              <label className="text-sm text-muted-foreground">GRN note</label>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Invoice #, remarks…" />
            </div>
            <Button onClick={receive} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <PackageCheck />} Post receipt</Button>
          </div>
        </div>
      )}

      {/* Payment */}
      {po.status !== "cancelled" && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-display font-semibold"><Wallet className="size-4 text-primary" /> Vendor payment</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Info label="Total" value={formatPKR(po.grandTotal)} />
            <Info label="Paid" value={formatPKR(po.amountPaid)} />
            <Info label="Outstanding" value={formatPKR(outstanding)} alert={outstanding > 0} />
          </div>
          {outstanding > 0 && (
            <div className="mt-4 flex items-end gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-muted-foreground">Amount</label>
                <Input type="number" min={0} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder={String(outstanding)} className="w-40" />
              </div>
              <Button variant="secondary" onClick={() => setPayAmount(String(outstanding))}>Full</Button>
              <Button onClick={pay} disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Wallet />} Record payment</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Info({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`font-display text-lg font-bold ${alert ? "text-warning" : ""}`}>{value}</p>
    </div>
  );
}
