import { MapPin, CreditCard, Truck, Store } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OrderTimeline } from "@/components/storefront/order-timeline";
import { formatPKR, formatDateTime } from "@/lib/format";
import type { SerializedOrder } from "@/lib/queries/orders";

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "destructive" | "secondary"> = {
  placed: "warning",
  confirmed: "default",
  processing: "default",
  dispatched: "default",
  delivered: "success",
  picked_up: "success",
  cancelled: "destructive",
};

const PAYMENT_LABEL: Record<string, string> = {
  cod: "Cash on delivery",
  cash: "Cash (in-store)",
  mock_gateway: "Paid online",
  card: "Card",
  bank_transfer: "Bank transfer",
};

export function OrderDetails({ order }: { order: SerializedOrder }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="flex flex-col gap-6">
        {/* Items */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold">
              Order {order.orderNumber}
            </h2>
            <Badge variant={STATUS_VARIANT[order.status] ?? "secondary"}>
              {order.status.replace("_", " ")}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Placed {formatDateTime(order.placedAt)}
          </p>
          <Separator className="my-4" />
          <ul className="flex flex-col gap-3">
            {order.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded bg-surface-2 text-xs">{i.quantity}</span>
                  <div>
                    <p className="font-medium">{i.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{i.sku}</p>
                  </div>
                </div>
                <span className="font-medium">{formatPKR(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <Separator className="my-4" />
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Subtotal" value={formatPKR(order.subtotal)} />
            <Row label="GST" value={formatPKR(order.taxTotal)} />
            <Row label="Delivery" value={order.shippingTotal === 0 ? "Free" : formatPKR(order.shippingTotal)} />
            <Separator className="my-1" />
            <div className="flex justify-between font-display text-base font-bold">
              <span>Total</span>
              <span>{formatPKR(order.grandTotal)}</span>
            </div>
          </dl>
        </div>

        {/* Meta */}
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard
            icon={order.fulfillment === "pickup" ? <Store className="size-4" /> : <Truck className="size-4" />}
            title={order.fulfillment === "pickup" ? "In-store pickup" : "Delivery"}
          >
            {order.shippingAddress ? (
              <span className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                {order.shippingAddress}
              </span>
            ) : (
              "Collect from our store"
            )}
          </InfoCard>
          <InfoCard icon={<CreditCard className="size-4" />} title="Payment">
            {order.payments.map((p, i) => (
              <span key={i} className="flex items-center justify-between gap-2">
                {PAYMENT_LABEL[p.method] ?? p.method}
                <Badge variant={p.status === "paid" ? "success" : "warning"}>{p.status}</Badge>
              </span>
            ))}
          </InfoCard>
        </div>
      </div>

      {/* Timeline */}
      <aside>
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-5 font-display font-semibold">Order status</h2>
          <OrderTimeline status={order.status} fulfillment={order.fulfillment} events={order.events} />
        </div>
      </aside>
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

function InfoCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-sm">
      <h3 className="flex items-center gap-2 font-medium text-foreground">
        <span className="text-primary">{icon}</span>
        {title}
      </h3>
      <div className="mt-2 flex flex-col gap-1.5 text-muted-foreground">{children}</div>
    </div>
  );
}
