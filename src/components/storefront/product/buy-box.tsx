"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import { StockBadge } from "@/components/storefront/stock-badge";
import { useCart } from "@/lib/cart/store";
import { useLiveStock } from "@/hooks/use-live-stock";
import type { ProductDetail } from "@/lib/queries/catalog";

export function BuyBox({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);
  const available = useLiveStock(product.id, product.available);
  const [qty, setQty] = useState(1);
  const max = Math.max(1, available);

  function buyNow() {
    if (available <= 0) return;
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        price: product.price,
        image: product.image,
      },
      qty,
    );
    router.push("/checkout");
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <StockBadge
          productId={product.id}
          initial={product.available}
          lowThreshold={product.reorderLevel}
          showCount
        />
      </div>

      <div className="flex items-center gap-4">
        <span className="text-xs text-muted-foreground">Quantity</span>
        <div className="flex items-center rounded-lg border border-border">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="grid size-10 place-items-center text-muted-foreground hover:text-foreground"
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-10 text-center font-medium">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(max, q + 1))}
            className="grid size-10 place-items-center text-muted-foreground hover:text-foreground"
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <AddToCartButton product={product} qty={qty} size="lg" className="w-full" />
        <Button
          onClick={buyNow}
          variant="outline"
          size="lg"
          disabled={available <= 0}
          className="w-full"
        >
          <Zap /> Buy now
        </Button>
      </div>
    </div>
  );
}
