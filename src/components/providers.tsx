"use client";

import { useEffect, useRef, useState } from "react";
import { SessionProvider } from "next-auth/react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster, toast } from "sonner";
import { useRealtimeStore } from "@/lib/realtime/store";
import { ThemeProvider, useTheme } from "@/components/theme/theme-provider";

// Opens the single SSE connection and pipes live events into the store + cache.
function RealtimeBridge() {
  const setConnected = useRealtimeStore((s) => s.setConnected);
  const setAvailable = useRealtimeStore((s) => s.setAvailable);
  const lowToast = useRef<Set<string>>(new Set());

  useEffect(() => {
    const es = new EventSource("/api/realtime/stream");

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data);
        if (event.type === "stock.changed") {
          setAvailable(event.productId, event.available);
        } else if (event.type === "stock.low") {
          // de-dupe noisy low-stock alerts per product per session
          if (!lowToast.current.has(event.productId)) {
            lowToast.current.add(event.productId);
            toast.warning(`Low stock: ${event.name}`, {
              description: `${event.available} left (reorder at ${event.reorderLevel})`,
            });
          }
        }
      } catch {
        /* ignore malformed frame */
      }
    };

    return () => es.close();
  }, [setConnected, setAvailable]);

  return null;
}

// Toaster that follows the active theme.
function ThemedToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="top-right"
      toastOptions={{
        style: {
          background: "var(--popover)",
          border: "1px solid var(--border)",
          color: "var(--foreground)",
        },
      }}
    />
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <ThemeProvider>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          <RealtimeBridge />
          {children}
          <ThemedToaster />
        </QueryClientProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
