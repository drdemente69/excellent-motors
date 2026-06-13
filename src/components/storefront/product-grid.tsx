import { ProductCard } from "@/components/storefront/product-card";
import type { ProductCard as ProductCardData } from "@/lib/queries/catalog";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  className,
}: {
  products: ProductCardData[];
  className?: string;
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
        No products found.
      </div>
    );
  }
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
        className,
      )}
    >
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}
