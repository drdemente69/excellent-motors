"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Pause,
  PlayCircle,
  CreditCard,
  Banknote,
  Printer,
  CheckCircle2,
  X,
  Receipt as ReceiptIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatPKR } from "@/lib/format";
import { useRealtimeStore } from "@/lib/realtime/store";
import { Receipt, type ReceiptData } from "@/components/pos/receipt";
import {
  completeSaleAction,
  holdSaleAction,
  discardHeldAction,
} from "@/app/pos/actions";
import type { PosProduct } from "@/lib/queries/pos";

type CartLine = {
  productId: string;
  name: string;
  sku: string;
  price: number;
  taxRatePct: number;
  qty: number;
};

type HeldSale = {
  id: string;
  label: string;
  createdAt: string;
  itemCount: number;
  total: number;
  items: { productId: string; quantity: number }[];
};

type PaymentRow = { method: "cash" | "card"; amount: number };

export function PosTerminal({
  products,
  categories,
  heldSales,
  cashierName,
  business,
}: {
  products: PosProduct[];
  categories: { slug: string; name: string }[];
  heldSales: HeldSale[];
  cashierName: string;
  business: { name: string; address: string; phone: string; ntn: string; taxRate: number };
}) {
  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const liveAvailable = useRealtimeStore((s) => s.available);

  const [cart, setCart] = useState<CartLine[]>([]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState("");
  const [held, setHeld] = useState<HeldSale[]>(heldSales);

  const [payOpen, setPayOpen] = useState(false);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [recallOpen, setRecallOpen] = useState(false);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const searchRef = useRef<HTMLInputElement>(null);

  function availableFor(id: string) {
    const base = liveAvailable[id] ?? productMap.get(id)?.available ?? 0;
    return base;
  }
  function inCart(id: string) {
    return cart.find((c) => c.productId === id)?.qty ?? 0;
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category && !categoryMatch(p, category, categories)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q) ||
        (p.partNumber ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, query, category, categories]);

  const subtotal = cart.reduce((s, l) => s + l.price * l.qty, 0);
  const taxTotal = cart.reduce((s, l) => s + (l.price * l.qty * l.taxRatePct) / 100, 0);
  const discountNum = Math.min(Math.max(0, Number(discount) || 0), subtotal);
  const total = Math.round(subtotal + taxTotal - discountNum);

  function addProduct(p: PosProduct) {
    const avail = availableFor(p.id);
    if (inCart(p.id) + 1 > avail) {
      toast.error(`${p.name} is out of stock`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === p.id);
      if (existing) {
        return prev.map((c) => (c.productId === p.id ? { ...c, qty: c.qty + 1 } : c));
      }
      return [...prev, { productId: p.id, name: p.name, sku: p.sku, price: p.price, taxRatePct: p.taxRatePct, qty: 1 }];
    });
  }

  function changeQty(id: string, qty: number) {
    if (qty <= 0) return setCart((prev) => prev.filter((c) => c.productId !== id));
    if (qty > availableFor(id)) {
      toast.error("Not enough stock");
      return;
    }
    setCart((prev) => prev.map((c) => (c.productId === id ? { ...c, qty } : c)));
  }

  function onSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    const q = query.trim().toLowerCase();
    if (!q) return;
    const exact = products.find(
      (p) => p.barcode?.toLowerCase() === q || p.sku.toLowerCase() === q,
    );
    if (exact) {
      addProduct(exact);
      setQuery("");
    } else if (filtered.length === 1) {
      addProduct(filtered[0]);
      setQuery("");
    }
    searchRef.current?.focus();
  }

  function resetSale() {
    setCart([]);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount("");
  }

  function openPayment() {
    if (cart.length === 0) return;
    setPayments([{ method: "cash", amount: total }]);
    setPayOpen(true);
  }

  const paid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const remaining = total - paid;
  const change = Math.max(0, paid - total);

  async function complete() {
    setProcessing(true);
    const snapshot = cart.map((l) => ({ ...l }));
    const res = await completeSaleAction({
      items: cart.map((c) => ({ productId: c.productId, quantity: c.qty })),
      payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
      orderDiscount: discountNum,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
    });
    setProcessing(false);

    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    // Optimistically reflect the stock drop locally (SSE will confirm).
    for (const l of snapshot) {
      const cur = useRealtimeStore.getState().available[l.productId] ?? productMap.get(l.productId)?.available ?? 0;
      useRealtimeStore.getState().setAvailable(l.productId, cur - l.qty);
    }

    setReceipt({
      saleNumber: res.data.saleNumber,
      date: new Date().toISOString(),
      cashierName,
      customerName: customerName || undefined,
      items: snapshot.map((l) => ({
        name: l.name,
        sku: l.sku,
        quantity: l.qty,
        unitPrice: l.price,
        lineTotal: l.price * l.qty,
      })),
      subtotal: res.data.subtotal,
      taxTotal: res.data.taxTotal,
      discountTotal: res.data.discountTotal,
      grandTotal: res.data.grandTotal,
      payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
      change: res.data.change,
    });
    setPayOpen(false);
    resetSale();
    toast.success(`Sale ${res.data.saleNumber} complete`);
  }

  async function hold() {
    if (cart.length === 0) return;
    const label = window.prompt("Label this held sale (e.g. customer name):", customerName || "Walk-in");
    if (label === null) return;
    const res = await holdSaleAction({
      items: cart.map((c) => ({ productId: c.productId, quantity: c.qty })),
      label: label || "Held sale",
      customerName: customerName || undefined,
    });
    if (!res.ok) return toast.error(res.error);
    setHeld((h) => [
      { id: res.data.id, label: res.data.label, createdAt: new Date().toISOString(), itemCount: cart.length, total, items: cart.map((c) => ({ productId: c.productId, quantity: c.qty })) },
      ...h,
    ]);
    resetSale();
    toast.success("Sale held");
  }

  async function recall(h: HeldSale) {
    const lines: CartLine[] = [];
    for (const it of h.items) {
      const p = productMap.get(it.productId);
      if (p) lines.push({ productId: p.id, name: p.name, sku: p.sku, price: p.price, taxRatePct: p.taxRatePct, qty: it.quantity });
    }
    setCart(lines);
    await discardHeldAction(h.id);
    setHeld((hs) => hs.filter((x) => x.id !== h.id));
    setRecallOpen(false);
    toast.success("Sale recalled");
  }

  return (
    <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_400px]">
      {/* Catalogue */}
      <div className="flex min-h-0 flex-col border-r border-border">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={searchRef}
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKey}
              placeholder="Scan barcode or search name / SKU / part #…"
              className="h-11 pl-9"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <CategoryChip active={category === ""} onClick={() => setCategory("")}>All</CategoryChip>
            {categories.map((c) => (
              <CategoryChip key={c.slug} active={category === c.slug} onClick={() => setCategory(c.slug)}>
                {c.name}
              </CategoryChip>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => {
              const avail = availableFor(p.id);
              const out = avail <= 0;
              return (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  disabled={out}
                  className={cn(
                    "flex flex-col rounded-lg border border-border bg-card p-3 text-left transition-all hover:border-primary/50 hover:bg-surface-2 disabled:opacity-50",
                  )}
                >
                  <span className="line-clamp-2 text-sm font-medium">{p.name}</span>
                  <span className="mt-1 font-mono text-[11px] text-muted-foreground">{p.sku}</span>
                  <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="font-display text-sm font-bold">{formatPKR(p.price)}</span>
                    <Badge variant={out ? "destructive" : avail <= 5 ? "warning" : "secondary"}>{out ? "Out" : `${avail}`}</Badge>
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <p className="py-12 text-center text-sm text-muted-foreground">No products match your search.</p>
          )}
        </div>
      </div>

      {/* Cart */}
      <div className="flex min-h-0 flex-col bg-surface">
        <div className="flex items-center justify-between border-b border-border p-3">
          <h2 className="font-display font-semibold">Current sale</h2>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => setRecallOpen(true)}>
              <PlayCircle className="size-4" /> Recall{held.length > 0 ? ` (${held.length})` : ""}
            </Button>
            {cart.length > 0 && (
              <Button variant="ghost" size="icon" onClick={resetSale} aria-label="Clear sale">
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {cart.length === 0 ? (
            <div className="grid h-full place-items-center text-center text-sm text-muted-foreground">
              <div>
                <ReceiptIcon className="mx-auto size-10 opacity-40" />
                <p className="mt-2">Scan or tap a product to start.</p>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {cart.map((l) => (
                <li key={l.productId} className="rounded-lg border border-border bg-card p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{l.name}</p>
                      <p className="text-xs text-muted-foreground">{formatPKR(l.price)} each</p>
                    </div>
                    <button onClick={() => changeQty(l.productId, 0)} className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded-md border border-border">
                      <button onClick={() => changeQty(l.productId, l.qty - 1)} className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"><Minus className="size-3.5" /></button>
                      <span className="w-9 text-center text-sm font-medium">{l.qty}</span>
                      <button onClick={() => changeQty(l.productId, l.qty + 1)} className="grid size-8 place-items-center text-muted-foreground hover:text-foreground"><Plus className="size-3.5" /></button>
                    </div>
                    <span className="font-display text-sm font-bold">{formatPKR(l.price * l.qty)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Totals + actions */}
        <div className="border-t border-border p-3">
          <div className="mb-2 grid grid-cols-2 gap-2">
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer (optional)" className="h-9" />
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone" className="h-9" />
          </div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">Discount (Rs)</span>
            <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="0" className="h-9 w-28 text-right" />
          </div>
          <dl className="flex flex-col gap-1 text-sm">
            <Row label="Subtotal" value={formatPKR(subtotal)} />
            <Row label={`GST (${business.taxRate}%)`} value={formatPKR(taxTotal)} />
            {discountNum > 0 && <Row label="Discount" value={`- ${formatPKR(discountNum)}`} />}
          </dl>
          <div className="my-2 flex items-center justify-between border-t border-border pt-2">
            <span className="font-display font-bold">Total</span>
            <span className="font-display text-2xl font-bold">{formatPKR(total)}</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Button size="lg" disabled={cart.length === 0} onClick={openPayment}>
              <CreditCard /> Charge {cart.length > 0 ? formatPKR(total) : ""}
            </Button>
            <Button size="lg" variant="outline" disabled={cart.length === 0} onClick={hold}>
              <Pause /> Hold
            </Button>
          </div>
        </div>
      </div>

      {/* Payment dialog */}
      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Take payment</DialogTitle>
          </DialogHeader>
          <div className="rounded-lg bg-surface-2 p-4 text-center">
            <p className="text-xs text-muted-foreground">Amount due</p>
            <p className="font-display text-3xl font-bold">{formatPKR(total)}</p>
          </div>

          <div className="flex flex-col gap-2">
            {payments.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex rounded-lg border border-border p-0.5">
                  <button onClick={() => setPayments((ps) => ps.map((x, j) => (j === i ? { ...x, method: "cash" } : x)))} className={cn("flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs", p.method === "cash" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                    <Banknote className="size-3.5" /> Cash
                  </button>
                  <button onClick={() => setPayments((ps) => ps.map((x, j) => (j === i ? { ...x, method: "card" } : x)))} className={cn("flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs", p.method === "card" ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>
                    <CreditCard className="size-3.5" /> Card
                  </button>
                </div>
                <Input type="number" value={p.amount} onChange={(e) => setPayments((ps) => ps.map((x, j) => (j === i ? { ...x, amount: Number(e.target.value) } : x)))} className="h-10 flex-1 text-right" />
                {payments.length > 1 && (
                  <button onClick={() => setPayments((ps) => ps.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><X className="size-4" /></button>
                )}
              </div>
            ))}
            <button onClick={() => setPayments((ps) => [...ps, { method: "card", amount: Math.max(0, remaining) }])} className="self-start text-xs font-medium text-primary hover:underline">
              + Split payment
            </button>
          </div>

          {/* Quick cash */}
          <div className="flex flex-wrap gap-1.5">
            {quickCash(total).map((amt) => (
              <button key={amt} onClick={() => setPayments([{ method: "cash", amount: amt }])} className="rounded-md border border-border px-2.5 py-1 text-xs hover:border-primary/50">
                {formatPKR(amt)}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-lg bg-surface-2 p-3 text-sm">
            {remaining > 0 ? (
              <><span className="text-muted-foreground">Remaining</span><span className="font-bold text-warning">{formatPKR(remaining)}</span></>
            ) : (
              <><span className="text-muted-foreground">Change</span><span className="font-bold text-success">{formatPKR(change)}</span></>
            )}
          </div>

          <Button size="lg" disabled={processing || remaining > 0} onClick={complete}>
            {processing ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Complete sale
          </Button>
        </DialogContent>
      </Dialog>

      {/* Recall dialog */}
      <Dialog open={recallOpen} onOpenChange={setRecallOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Held sales</DialogTitle>
          </DialogHeader>
          {held.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No held sales.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {held.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-medium">{h.label}</p>
                    <p className="text-xs text-muted-foreground">{h.itemCount} items · {formatPKR(h.total)}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => recall(h)}>Recall</Button>
                    <Button size="sm" variant="ghost" onClick={async () => { await discardHeldAction(h.id); setHeld((hs) => hs.filter((x) => x.id !== h.id)); }}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt dialog */}
      <Dialog open={!!receipt} onOpenChange={(o) => !o && setReceipt(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="size-5 text-success" /> Sale complete</DialogTitle>
          </DialogHeader>
          {receipt && (
            <div className="max-h-[60vh] overflow-y-auto rounded-lg border border-border">
              <Receipt data={receipt} business={business} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => window.print()}><Printer /> Print</Button>
            <Button onClick={() => setReceipt(null)}>New sale</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function categoryMatch(p: PosProduct, slug: string, categories: { slug: string; name: string }[]) {
  const cat = categories.find((c) => c.slug === slug);
  return cat ? p.category === cat.name : true;
}

function quickCash(total: number) {
  const set = new Set<number>([total]);
  for (const note of [500, 1000, 5000]) set.add(Math.ceil(total / note) * note);
  return Array.from(set).sort((a, b) => a - b).slice(0, 4);
}

function CategoryChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn("rounded-full border px-3 py-1 text-xs transition-colors", active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-surface-2")}>
      {children}
    </button>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
