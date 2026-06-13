import { subscribe, type RealtimeEvent } from "@/lib/realtime/bus";

// Server-Sent Events stream. Both the storefront and the POS subscribe here to
// receive live stock/order updates. Node runtime (EventEmitter) + always dynamic.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const send = (event: RealtimeEvent) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          closed = true;
        }
      };

      // Initial hello so the client flips to "connected" immediately.
      send({ type: "ping" });

      const unsubscribe = subscribe(send);
      // Heartbeat keeps proxies from killing the idle connection.
      const heartbeat = setInterval(() => send({ type: "ping" }), 25000);

      const close = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      request.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
