"use client";

import Link from "next/link";
import Image from "next/image";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart, cartCount, cartSubtotal } from "@/lib/cart/store";
import { useMounted } from "@/hooks/use-mounted";
import { formatPKR } from "@/lib/format";

export function CartDrawer() {
  const mounted = useMounted();
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const removeItem = useCart((s) => s.removeItem);

  const count = mounted ? cartCount(items) : 0;
  const subtotal = cartSubtotal(items);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open cart">
          <ShoppingCart />
          {mounted && count > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent>
        <SheetHeader>
          <SheetTitle>Your cart {count > 0 && `(${count})`}</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
            <ShoppingCart className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Your cart is empty.</p>
            <SheetClose asChild>
              <Button variant="secondary" asChild>
                <Link href="/shop">Browse parts</Link>
              </Button>
            </SheetClose>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5">
              <ul className="flex flex-col gap-4">
                {items.map((item) => (
                  <li key={item.productId} className="flex gap-3">
                    <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1">
                      <Link
                        href={`/product/${item.slug}`}
                        className="line-clamp-2 text-sm font-medium hover:text-primary"
                      >
                        {item.name}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {formatPKR(item.price)}
                      </span>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex items-center rounded-md border border-border">
                          <button
                            onClick={() => setQty(item.productId, item.quantity - 1)}
                            className="grid size-7 place-items-center text-muted-foreground hover:text-foreground"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => setQty(item.productId, item.quantity + 1)}
                            className="grid size-7 place-items-center text-muted-foreground hover:text-foreground"
                            aria-label="Increase quantity"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="ml-auto text-muted-foreground hover:text-destructive"
                          aria-label="Remove item"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </div>
                    <div className="text-sm font-semibold">
                      {formatPKR(item.price * item.quantity)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <SheetFooter>
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Subtotal</span>
                <span className="font-display text-lg font-bold">
                  {formatPKR(subtotal)}
                </span>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">
                Tax & delivery calculated at checkout.
              </p>
              <Separator className="mb-3" />
              <SheetClose asChild>
                <Button asChild className="w-full" size="lg">
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
