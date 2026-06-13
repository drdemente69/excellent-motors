import { getCatalog, getCategoriesWithCounts, getBrands, type CatalogFilters } from "@/lib/queries/catalog";
import { ProductGrid } from "@/components/storefront/product-grid";
import { FiltersPanel } from "@/components/storefront/catalog/filters-panel";
import { MobileFilters } from "@/components/storefront/catalog/mobile-filters";
import { SortSelect } from "@/components/storefront/catalog/sort-select";
import { ActiveFilters } from "@/components/storefront/catalog/active-filters";
import { Pagination } from "@/components/storefront/catalog/pagination";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shop car parts",
  description: "Browse the full Excellent Motors catalogue with live stock, filters and vehicle fitment.",
};

type SP = Record<string, string | string[] | undefined>;

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function num(v: string | string[] | undefined): number | undefined {
  const s = str(v);
  if (s == null || s === "") return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;

  const filters: CatalogFilters = {
    q: str(sp.q),
    category: str(sp.category),
    brand: str(sp.brand),
    minPrice: num(sp.minPrice),
    maxPrice: num(sp.maxPrice),
    sort: str(sp.sort) as CatalogFilters["sort"],
    make: str(sp.make),
    model: str(sp.model),
    year: num(sp.year),
    page: num(sp.page) ?? 1,
    perPage: 12,
  };

  const [{ products, total, page, pages }, categories, brands] = await Promise.all([
    getCatalog(filters),
    getCategoriesWithCounts(),
    getBrands(),
  ]);

  const catOptions = categories.map((c) => ({ slug: c.slug, name: c.name, count: c.count }));
  const brandOptions = brands.map((b) => ({ slug: b.slug, name: b.name }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {filters.q ? `Results for “${filters.q}”` : "All parts"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "product" : "products"} available
          {filters.make ? ` · fits ${filters.make}${filters.model ? ` ${filters.model}` : ""}${filters.year ? ` ${filters.year}` : ""}` : ""}
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-5">
            <FiltersPanel categories={catOptions} brands={brandOptions} />
          </div>
        </aside>

        <div>
          <div className="mb-5 flex items-center justify-between gap-3">
            <MobileFilters categories={catOptions} brands={brandOptions} />
            <div className="ml-auto">
              <SortSelect />
            </div>
          </div>

          <ActiveFilters />

          <ProductGrid products={products} className="sm:grid-cols-2 xl:grid-cols-3" />
          <Pagination page={page} pages={pages} />
        </div>
      </div>
    </div>
  );
}
