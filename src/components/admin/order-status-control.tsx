"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, Ban, Loader2, CheckCircle2 } from "lucide-react";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrderStatusAction } from "@/app/admin/orders/actions";

const NEXT: Record<string, Record<string, OrderStatus>> = {
  delivery: { placed: "confirmed", confirmed: "processing", processing: "dispatched", dispatched: "delivered" },
  pickup: { placed: "confirmed", confirmed: "processing", processing: "picked_up" },
};

const ADVANCE_LABEL: Record<string, string> = {
  confirmed: "Confirm order",
  processing: "Start processing",
  dispatched: "Mark dispatched",
  delivered: "Mark delivered",
  picked_up: "Mark picked up",
};

const ALL_STATUSES: OrderStatus[] = ["placed", "confirmed", "processing", "dispatched", "delivered", "picked_up", "cancelled"];

const selectCls = "h-10 rounded-lg border border-input bg-surface px-3 text-sm capitalize";

export function OrderStatusControl({
  orderId,
  status,
  fulfillment,
}: {
  orderId: string;
  status: string;
  fulfillment: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [manual, setManual] = useState<OrderStatus>(status as OrderStatus);
  const [busy, setBusy] = useState(false);

  const terminal = status === "delivered" || status === "picked_up" || status === "cancelled";
  const next = NEXT[fulfillment]?.[status];

  async function apply(target: OrderStatus) {
    setBusy(true);
    const res = await updateOrderStatusAction(orderId, target, note || undefined);
    setBusy(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`Order marked ${target.replace("_", " ")} — customer notified`);
    setNote("");
    router.refresh();
  }

  if (terminal) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-2 flex items-center gap-2 font-display font-semibold">
          <CheckCircle2 className="size-4 text-success" /> Fulfilment
        </h2>
        <p className="text-sm text-muted-foreground">
          This order is <span className="font-medium text-foreground">{status.replace("_", " ")}</span> — no further action needed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-1 font-display font-semibold">Fulfilment</h2>
      <p className="mb-4 text-sm text-muted-foreground">Advancing the status emails the customer and posts an in-app notification.</p>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="note">Note to customer (optional)</Label>
        <Input id="note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Dispatched via TCS, tracking #12345" />
      </div>

      {next && (
        <Button onClick={() => apply(next)} disabled={busy} size="lg" className="mt-4 w-full">
          {busy ? <Loader2 className="animate-spin" /> : <ArrowRight />} {ADVANCE_LABEL[next]}
        </Button>
      )}

      <div className="mt-4 flex items-end gap-2 border-t border-border pt-4">
        <div className="flex flex-1 flex-col gap-1.5">
          <Label>Set status manually</Label>
          <select value={manual} onChange={(e) => setManual(e.target.value as OrderStatus)} className={selectCls}>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <Button variant="secondary" onClick={() => apply(manual)} disabled={busy || manual === status}>Update</Button>
      </div>

      {status !== "cancelled" && (
        <Button variant="ghost" onClick={() => apply("cancelled")} disabled={busy} className="mt-2 w-full text-destructive hover:text-destructive">
          <Ban /> Cancel order
        </Button>
      )}
    </div>
  );
}
