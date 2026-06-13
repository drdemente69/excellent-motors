import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Car, Package, Tag } from "lucide-react";
import { getProductBySlug, getCatalog } from "@/lib/queries/catalog";
import { getSettings } from "@/lib/settings";
import { formatPKR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ProductGallery } from "@/components/storefront/product/product-gallery";
import { BuyBox } from "@/components/storefront/product/buy-box";
import { ProductGrid } from "@/components/storefront/product-grid";
import { Section, SectionHeading } from "@/components/storefront/section";
import { JsonLd } from "@/components/seo/json-ld";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.shortDesc ?? product.description ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [{ products: related }, settings] = await Promise.all([
    getCatalog({ category: product.categorySlug, perPage: 4 }),
    getSettings(),
  ]);
  const relatedFiltered = related.filter((p) => p.id !== product.id).slice(0, 4);
  const taxAmount = (product.price * product.taxRatePct) / 100;
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3020";

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [`${base}${product.image}`],
    description: product.shortDesc ?? product.description ?? undefined,
    sku: product.sku,
    mpn: product.partNumber ?? undefined,
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    category: product.category,
    offers: {
      "@type": "Offer",
      url: `${base}/product/${product.slug}`,
      priceCurrency: "PKR",
      price: product.price,
      availability: product.available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd data={productLd} />

      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="size-3.5" />
        <Link href={`/shop?category=${product.categorySlug}`} className="hover:text-foreground">
          {product.category}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          categorySlug={product.categorySlug}
          model3dUrl={product.model3dUrl}
          name={product.name}
        />

        <div>
          <div className="flex items-center gap-2 text-sm">
            {product.brand && <Badge variant="accent">{product.brand}</Badge>}
            <span className="text-muted-foreground">{product.category}</span>
          </div>

          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {product.name}
          </h1>

          {/* Identifiers */}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Package className="size-4" /> SKU <span className="font-mono text-foreground">{product.sku}</span>
            </span>
            {product.partNumber && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Tag className="size-4" /> Part # <span className="font-mono text-foreground">{product.partNumber}</span>
              </span>
            )}
            {product.oemNumber && (
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                OEM # <span className="font-mono text-foreground">{product.oemNumber}</span>
              </span>
            )}
          </div>

          {product.shortDesc && (
            <p className="mt-5 text-muted-foreground">{product.shortDesc}</p>
          )}

          <div className="mt-6 flex items-end gap-3">
            <span className="font-display text-3xl font-bold">{formatPKR(product.price)}</span>
            <span className="pb-1 text-xs text-muted-foreground">
              incl. {formatPKR(taxAmount)} GST ({product.taxRatePct}%)
            </span>
          </div>

          <div className="mt-6">
            <BuyBox product={product} />
          </div>

          {/* Compatibility */}
          {product.fitments.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
                <Car className="size-4 text-primary" /> Compatible vehicles
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {product.fitments.map((f, i) => (
                  <li key={i}>
                    <Badge variant="secondary">
                      {f.make} {f.model} · {f.years}
                      {f.variant ? ` · ${f.variant}` : ""}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Details tabs */}
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specs">Specifications</TabsTrigger>
            <TabsTrigger value="shipping">Delivery & returns</TabsTrigger>
          </TabsList>
          <TabsContent value="description">
            <div className="max-w-3xl rounded-xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
              {product.description ?? product.shortDesc ?? "No description available."}
            </div>
          </TabsContent>
          <TabsContent value="specs">
            <div className="max-w-3xl overflow-hidden rounded-xl border border-border bg-card text-sm">
              {[
                ["Brand", product.brand ?? "—"],
                ["Category", product.category],
                ["SKU", product.sku],
                ["Part number", product.partNumber ?? "—"],
                ["OEM number", product.oemNumber ?? "—"],
                ["Tax (GST)", `${product.taxRatePct}%`],
              ].map(([k, v], i) => (
                <div key={k} className={i % 2 ? "bg-surface-2" : ""}>
                  <div className="flex justify-between px-5 py-3">
                    <span className="text-muted-foreground">{k}</span>
                    <span className="font-medium">{v}</span>
                  </div>
                  <Separator />
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="shipping">
            <div className="max-w-3xl rounded-xl border border-border bg-card p-6 text-sm leading-relaxed text-muted-foreground">
              <p>Delivery across Pakistan, or collect in-store at {settings.address}.</p>
              <p className="mt-2">Free delivery on orders over {formatPKR(15000)}. Cash on delivery, in-store pickup and online payment supported.</p>
              <p className="mt-2">Returns and exchanges accepted on unused parts in original packaging — see our returns policy.</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Related */}
      {relatedFiltered.length > 0 && (
        <Section className="px-0">
          <SectionHeading
            eyebrow="You may also need"
            title={`More in ${product.category}`}
            href={`/shop?category=${product.categorySlug}`}
          />
          <ProductGrid products={relatedFiltered} />
        </Section>
      )}
    </div>
  );
}
