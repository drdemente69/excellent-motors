"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Loader2, Truck, Store, Banknote, CreditCard, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart, cartSubtotal } from "@/lib/cart/store";
import { useMounted } from "@/hooks/use-mounted";
import { formatPKR } from "@/lib/format";
import { cn } from "@/lib/utils";

const TAX_RATE = 17;
const FREE_DELIVERY_THRESHOLD = 15000;
const DELIVERY_FEE = 300;

export function CheckoutForm() {
  const mounted = useMounted();
  const router = useRouter();
  const { data: session } = useSession();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);

  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "mock_gateway" | "cash">("cod");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    email: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    province: "",
    postalCode: "",
    notes: "",
  });

  useEffect(() => {
    if (session?.user) {
      setForm((f) => ({
        ...f,
        customerName: f.customerName || session.user.name || "",
        email: f.email || session.user.email || "",
      }));
    }
  }, [session]);

  // Keep a valid payment method per fulfilment type.
  useEffect(() => {
    setPaymentMethod(fulfillment === "pickup" ? "cash" : "cod");
  }, [fulfillment]);

  const subtotal = cartSubtotal(items);
  const tax = Math.round((subtotal * TAX_RATE) / 100);
  const shipping =
    fulfillment === "pickup" || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + tax + shipping;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (items.length === 0) return;
    if (!form.customerName || !form.email || !form.phone) {
      toast.error("Please fill in your name, email and phone.");
      return;
    }
    if (fulfillment === "delivery" && (!form.line1 || !form.city)) {
      toast.error("Please enter your delivery address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          customerName: form.customerName,
          email: form.email,
          phone: form.phone,
          fulfillment,
          paymentMethod,
          line1: form.line1,
          line2: form.line2,
          city: form.city,
          province: form.province,
          postalCode: form.postalCode,
          notes: form.notes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Checkout failed");
        setLoading(false);
        return;
      }
      clear();
      toast.success("Order placed!");
      router.push(`/order/${data.orderNumber}`);
    } catch {
      toast.error("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (mounted && items.length === 0) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-10 text-center">
        <ShoppingCart className="mx-auto size-10 text-muted-foreground" />
        <h2 className="mt-4 font-display text-lg font-semibold">Your cart is empty</h2>
        <p className="mt-1 text-sm text-muted-foreground">Add some parts before checking out.</p>
        <Button asChild className="mt-5">
          <Link href="/shop">Browse parts</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Form */}
      <div className="flex flex-col gap-6">
        {/* Fulfilment */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Fulfilment</h2>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <ChoiceCard
              active={fulfillment === "delivery"}
              onClick={() => setFulfillment("delivery")}
              icon={<Truck className="size-5" />}
              title="Delivery"
              desc="To your address"
            />
            <ChoiceCard
              active={fulfillment === "pickup"}
              onClick={() => setFulfillment("pickup")}
              icon={<Store className="size-5" />}
              title="Pickup"
              desc="Collect in-store"
            />
          </div>
        </section>

        {/* Contact */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Contact details</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={form.customerName} onChange={(v) => set("customerName", v)} />
            <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+92 3XX XXXXXXX" />
            <div className="sm:col-span-2">
              <Field label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />
            </div>
          </div>
        </section>

        {/* Address (delivery only) */}
        {fulfillment === "delivery" && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-display font-semibold">Delivery address</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Field label="Address line 1" value={form.line1} onChange={(v) => set("line1", v)} />
              </div>
              <div className="sm:col-span-2">
                <Field label="Address line 2 (optional)" value={form.line2} onChange={(v) => set("line2", v)} />
              </div>
              <Field label="City" value={form.city} onChange={(v) => set("city", v)} />
              <Field label="Province" value={form.province} onChange={(v) => set("province", v)} />
              <Field label="Postal code" value={form.postalCode} onChange={(v) => set("postalCode", v)} />
            </div>
          </section>
        )}

        {/* Payment */}
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Payment</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {fulfillment === "delivery" ? (
              <ChoiceCard
                active={paymentMethod === "cod"}
                onClick={() => setPaymentMethod("cod")}
                icon={<Banknote className="size-5" />}
                title="Cash on delivery"
                desc="Pay when it arrives"
              />
            ) : (
              <ChoiceCard
                active={paymentMethod === "cash"}
                onClick={() => setPaymentMethod("cash")}
                icon={<Banknote className="size-5" />}
                title="Pay at store"
                desc="Cash on pickup"
              />
            )}
            <ChoiceCard
              active={paymentMethod === "mock_gateway"}
              onClick={() => setPaymentMethod("mock_gateway")}
              icon={<CreditCard className="size-5" />}
              title="Pay online"
              desc="Card / wallet (test)"
            />
          </div>
          {paymentMethod === "mock_gateway" && (
            <p className="mt-3 rounded-lg bg-surface-2 p-3 text-xs text-muted-foreground">
              Using the built-in <span className="font-medium text-foreground">test</span> payment provider.
              Plug in JazzCash / Easypaisa / a card gateway later via the PaymentProvider interface.
            </p>
          )}
          <div className="mt-4">
            <Label className="mb-1.5 block">Order notes (optional)</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Any special instructions…"
            />
          </div>
        </section>
      </div>

      {/* Summary */}
      <aside>
        <div className="sticky top-20 rounded-xl border border-border bg-card p-5">
          <h2 className="font-display font-semibold">Order summary</h2>
          <ul className="mt-4 flex flex-col gap-3">
            {items.map((i) => (
              <li key={i.productId} className="flex items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2">
                  <Image src={i.image} alt={i.name} fill className="object-cover" sizes="48px" />
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {i.quantity}
                  </span>
                </div>
                <span className="line-clamp-2 flex-1 text-xs">{i.name}</span>
                <span className="text-sm font-medium">{formatPKR(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Subtotal" value={formatPKR(subtotal)} />
            <Row label={`GST (${TAX_RATE}%)`} value={formatPKR(tax)} />
            <Row label="Delivery" value={shipping === 0 ? "Free" : formatPKR(shipping)} />
          </dl>
          <Separator className="my-4" />
          <div className="flex items-center justify-between">
            <span className="font-display font-semibold">Total</span>
            <span className="font-display text-xl font-bold">{formatPKR(total)}</span>
          </div>
          <Button onClick={submit} disabled={loading} size="lg" className="mt-5 w-full">
            {loading && <Loader2 className="animate-spin" />}
            Place order · {formatPKR(total)}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            By placing this order you agree to our terms.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
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

function ChoiceCard({
  active,
  onClick,
  icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 text-left transition-all",
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40",
      )}
    >
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground")}>
        {icon}
      </span>
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{desc}</span>
      </span>
    </button>
  );
}
