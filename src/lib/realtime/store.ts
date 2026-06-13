"use client";

import { create } from "zustand";

// Client-side cache of the latest live stock numbers pushed over SSE, keyed by
// productId. Storefront badges and POS read from here so every surface shows the
// same number the instant it changes anywhere.

type RealtimeState = {
  connected: boolean;
  available: Record<string, number>;
  setConnected: (v: boolean) => void;
  setAvailable: (productId: string, available: number) => void;
};

export const useRealtimeStore = create<RealtimeState>((set) => ({
  connected: false,
  available: {},
  setConnected: (connected) => set({ connected }),
  setAvailable: (productId, available) =>
    set((s) => ({ available: { ...s.available, [productId]: available } })),
}));
