"use client";

import { useRealtimeStore } from "@/lib/realtime/store";
import { cn } from "@/lib/utils";

// Shows whether this client is connected to the live stock/order stream.
export function RealtimeIndicator() {
  const connected = useRealtimeStore((s) => s.connected);
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 text-xs">
      <span
        className={cn(
          "size-2 rounded-full",
          connected ? "bg-success animate-pulse" : "bg-muted-foreground",
        )}
      />
      <span className="text-muted-foreground">{connected ? "Live sync" : "Offline"}</span>
    </span>
  );
}
