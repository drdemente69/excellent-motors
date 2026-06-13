"use client";

import { useRealtimeStore } from "@/lib/realtime/store";

/**
 * Live available-stock for a product. Falls back to the server-rendered value
 * until the first SSE update arrives, so it's correct on first paint and stays
 * correct in real time afterwards.
 */
export function useLiveStock(productId: string, initial: number): number {
  const live = useRealtimeStore((s) => s.available[productId]);
  return live ?? initial;
}
