import { EventEmitter } from "node:events";

// In-process pub/sub backing the Server-Sent Events channel.
//
// Every stock change, order update, and low-stock alert is published here and
// fanned out to all connected clients (storefront + POS) in real time.
//
// NOTE: a single Node process is the source of truth in dev/single-instance
// deployments. To scale horizontally, swap this emitter for Redis pub/sub or
// Postgres LISTEN/NOTIFY — the publish()/subscribe() surface stays the same.

export type RealtimeEvent =
  | {
      type: "stock.changed";
      productId: string;
      warehouseId: string;
      quantity: number;
      available: number;
      sku: string;
    }
  | {
      type: "stock.low";
      productId: string;
      sku: string;
      name: string;
      available: number;
      reorderLevel: number;
    }
  | { type: "order.created"; orderId: string; orderNumber: string }
  | { type: "order.updated"; orderId: string; status: string }
  | { type: "pos.sale"; saleId: string; saleNumber: string }
  | { type: "ping" };

const globalForBus = globalThis as unknown as {
  __emReady?: EventEmitter;
};

const emitter =
  globalForBus.__emReady ??
  (() => {
    const e = new EventEmitter();
    e.setMaxListeners(0); // many SSE clients
    globalForBus.__emReady = e;
    return e;
  })();

const CHANNEL = "realtime";

export function publish(event: RealtimeEvent) {
  emitter.emit(CHANNEL, event);
}

export function subscribe(listener: (event: RealtimeEvent) => void) {
  emitter.on(CHANNEL, listener);
  return () => emitter.off(CHANNEL, listener);
}
