"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Client cart (persisted to localStorage). Holds price/stock snapshots for fast
// UI; the server RE-VALIDATES every line at checkout before creating the order
// and decrementing stock atomically — the cart is never trusted for pricing.

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  price: number;
  image: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeItem: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: i.quantity + qty }
                  : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: qty }] };
        }),
      removeItem: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      setQty: (productId, qty) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
            .filter((i) => i.quantity > 0),
        })),
      clear: () => set({ items: [] }),
    }),
    { name: "em-cart" },
  ),
);

export function cartCount(items: CartItem[]) {
  return items.reduce((n, i) => n + i.quantity, 0);
}

export function cartSubtotal(items: CartItem[]) {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}
