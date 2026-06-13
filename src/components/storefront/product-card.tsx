"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatPKR } from "@/lib/format";
import { StockBadge } from "@/components/storefront/stock-badge";
import { AddToCartButton } from "@/components/storefront/add-to-cart-button";
import type { ProductCard as ProductCardData } from "@/lib/queries/catalog";

export function ProductCard({
  product,
  index = 0,
}: {
  product: ProductCardData;
  index?: number;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-primary/40"
    >
      <Link href={`/product/${product.slug}`} className="relative block">
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <StockBadge
              productId={product.id}
              initial={product.available}
              lowThreshold={product.reorderLevel}
            />
          </div>
          {product.isFeatured && (
            <div className="absolute right-3 top-3 rounded-full bg-primary/90 px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
              Featured
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{product.brand ?? product.category}</span>
          {product.partNumber && (
            <span className="font-mono text-[11px]">{product.partNumber}</span>
          )}
        </div>
        <Link href={`/product/${product.slug}`} className="flex-1">
          <h3 className="font-display text-sm font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
            {product.name}
          </h3>
        </Link>
        <div className="mt-1 flex items-end justify-between gap-2">
          <span className="font-display text-lg font-bold text-foreground">
            {formatPKR(product.price)}
          </span>
          <AddToCartButton
            product={product}
            size="sm"
            variant="secondary"
            label="Add"
          />
        </div>
      </div>
    </motion.article>
  );
}
