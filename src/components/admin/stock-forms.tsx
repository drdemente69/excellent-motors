"use client";

import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeftRight, Warehouse as WarehouseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  adjustStockAction,
  transferStockAction,
  createWarehouseAction,
} from "@/app/admin/stock/actions";

type ProductOpt = { id: string; name: string; sku: string; stock: number };
type WarehouseOpt = { id: string; name: string };
type State = { ok?: boolean; error?: string; message?: string } | undefined;

const selectCls =
  "h-11 w-full rounded-lg border border-input bg-surface px-3.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

function Submit({ label, icon }: { label: string; icon: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : icon} {label}
    </Button>
  );
}

function useToastState(state: State) {
  useEffect(() => {
    if (state?.ok) toast.success(state.message ?? "Done");
    else if (state?.error) toast.error(state.error);
  }, [state]);
}

export function StockAdjustForm({ products }: { products: ProductOpt[] }) {
  const [state, action] = useActionState(adjustStockAction, undefined);
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const current = products.find((p) => p.id === productId)?.stock ?? 0;
  useToastState(state);

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1.5">
        <Label>Product</Label>
        <select name="productId" value={productId} onChange={(e) => setProductId(e.target.value)} className={selectCls}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.sku}) — {p.stock} in stock</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Current on-hand</Label>
          <Input value={current} disabled />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="newQuantity">New on-hand</Label>
          <Input id="newQuantity" name="newQuantity" type="number" min={0} defaultValue={current} key={productId} />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="reason">Reason</Label>
        <Input id="reason" name="reason" placeholder="Stock-take correction, damage, etc." />
      </div>
      <Submit label="Apply adjustment" icon={<Save />} />
    </form>
  );
}

export function StockTransferForm({
  products,
  warehouses,
}: {
  products: ProductOpt[];
  warehouses: WarehouseOpt[];
}) {
  const [state, action] = useActionState(transferStockAction, undefined);
  useToastState(state);

  if (warehouses.length < 2) {
    return (
      <div className="max-w-lg rounded-xl border border-dashed border-border bg-card p-6 text-sm text-muted-foreground">
        Add a second warehouse below to enable transfers.
      </div>
    );
  }

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-col gap-1.5">
        <Label>Product</Label>
        <select name="productId" className={selectCls} defaultValue={products[0]?.id}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>From</Label>
          <select name="fromWarehouseId" className={selectCls} defaultValue={warehouses[0]?.id}>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>To</Label>
          <select name="toWarehouseId" className={selectCls} defaultValue={warehouses[1]?.id}>
            {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="quantity">Quantity</Label>
          <Input id="quantity" name="quantity" type="number" min={1} defaultValue={1} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="treason">Reason</Label>
          <Input id="treason" name="reason" placeholder="Restock branch" />
        </div>
      </div>
      <Submit label="Transfer stock" icon={<ArrowLeftRight />} />
    </form>
  );
}

export function WarehouseForm() {
  const [state, action] = useActionState(createWarehouseAction, undefined);
  useToastState(state);
  return (
    <form action={action} className="flex max-w-lg flex-col gap-4 rounded-xl border border-border bg-card p-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wname">Warehouse name</Label>
          <Input id="wname" name="name" placeholder="Branch — Karachi" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wcode">Code</Label>
          <Input id="wcode" name="code" placeholder="KHI" className="font-mono" />
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="waddr">Address</Label>
        <Input id="waddr" name="address" placeholder="Optional" />
      </div>
      <Submit label="Add warehouse" icon={<WarehouseIcon />} />
    </form>
  );
}
