import { Check, Circle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

const DELIVERY_STEPS = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "dispatched", label: "Dispatched" },
  { key: "delivered", label: "Delivered" },
];
const PICKUP_STEPS = [
  { key: "placed", label: "Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "processing", label: "Processing" },
  { key: "picked_up", label: "Picked up" },
];

export function OrderTimeline({
  status,
  fulfillment,
  events,
}: {
  status: string;
  fulfillment: string;
  events?: { status: string; createdAt: string; note?: string | null }[];
}) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive">
        <XCircle className="size-5" />
        <span className="font-medium">This order was cancelled.</span>
      </div>
    );
  }

  const steps = fulfillment === "pickup" ? PICKUP_STEPS : DELIVERY_STEPS;
  const currentIndex = Math.max(
    0,
    steps.findIndex((s) => s.key === status),
  );
  const eventMap = new Map((events ?? []).map((e) => [e.status, e.createdAt]));

  return (
    <ol className="relative ml-3 border-l border-border">
      {steps.map((step, i) => {
        const reached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const at = eventMap.get(step.key);
        return (
          <li key={step.key} className="mb-6 ml-6 last:mb-0">
            <span
              className={cn(
                "absolute -left-[13px] grid size-6 place-items-center rounded-full border",
                reached
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-surface text-muted-foreground",
              )}
            >
              {reached ? <Check className="size-3.5" /> : <Circle className="size-2.5" />}
            </span>
            <div className="flex flex-col">
              <span className={cn("font-medium", isCurrent && "text-primary")}>
                {step.label}
              </span>
              {at && (
                <span className="text-xs text-muted-foreground">{formatDateTime(at)}</span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
