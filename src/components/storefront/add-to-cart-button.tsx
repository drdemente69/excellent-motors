"use client";

import { toast } from "sonner";
import { ShoppingCart, Check } from "lucide-react";
import { useState } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCart } from "@/lib/cart/store";
import { useLiveStock } from "@/hooks/use-live-stock";
import type { ProductCard } from "@/lib/queries/catalog";

export function AddToCartButton({
  product,
  qty = 1,
  className,
  size,
  variant,
  label = "Add to cart",
}: {
  product: Pick<
    ProductCard,
    "id" | "slug" | "name" | "sku" | "price" | "image" | "available"
  >;
  qty?: number;
  className?: string;
  size?: ButtonProps["size"];
  variant?: ButtonProps["variant"];
  label?: string;
}) {
  const addItem = useCart((s) => s.addItem);
  const available = useLiveStock(product.id, product.available);
  const [added, setAdded] = useState(false);
  const soldOut = available <= 0;

  function handleAdd() {
    if (soldOut) return;
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
    setAdded(true);
    toast.success("Added to cart", { description: product.name });
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <Button
      onClick={handleAdd}
      disabled={soldOut}
      size={size}
      variant={variant}
      className={className}
    >
      {soldOut ? (
        "Out of stock"
      ) : added ? (
        <>
          <Check /> Added
        </>
      ) : (
        <>
          <ShoppingCart /> {label}
        </>
      )}
    </Button>
  );
}
