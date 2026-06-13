import Link from "next/link";
import { ArrowRight, ShieldCheck, Truck, Headphones, BadgeCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import {
  getFeaturedProducts,
  getLatestProducts,
  getCategoriesWithCounts,
  getVehicleTaxonomy,
} from "@/lib/queries/catalog";
import { CarHero } from "@/components/storefront/car-hero";
import { Section, SectionHeading } from "@/components/storefront/section";
import { ProductGrid } from "@/components/storefront/product-grid";
import { CategoryGrid } from "@/components/storefront/category-grid";
import { StatCounter } from "@/components/storefront/stat-counter";
import { Button } from "@/components/ui/button";

// Live stock must always be fresh on the storefront.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, latest, categories, taxonomy, productCount, brandCount, vehicleCount] =
    await Promise.all([
      getFeaturedProducts(8),
      getLatestProducts(8),
      getCategoriesWithCounts(),
      getVehicleTaxonomy(),
      prisma.product.count({ where: { status: "active" } }),
      prisma.brand.count(),
      prisma.vehicle.count(),
    ]);

  return (
    <>
      <CarHero taxonomy={taxonomy} />

      {/* Stats */}
      <Section className="py-20">
        <div className="grid grid-cols-2 gap-8 rounded-2xl border border-border bg-card p-8 sm:grid-cols-4">
          <StatCounter value={productCount} suffix="+" label="Parts in stock" />
          <StatCounter value={brandCount} suffix="+" label="Trusted brands" />
          <StatCounter value={vehicleCount} suffix="+" label="Vehicles supported" />
          <StatCounter value={24} suffix="h" label="Dispatch window" />
        </div>
      </Section>

      {/* Categories */}
      <Section className="pt-0">
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          description="Body kits, wheels, audio, lighting and more — build your car your way."
          href="/shop"
          hrefLabel="All parts"
        />
        <CategoryGrid categories={categories} />
      </Section>

      {/* Featured */}
      <Section className="pt-0">
        <SectionHeading
          eyebrow="Hand-picked"
          title="Featured parts"
          description="Popular, high-quality components our customers trust."
          href="/shop"
        />
        <ProductGrid products={featured} />
      </Section>

      {/* Promo banner */}
      <Section className="pt-0">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-background p-8 sm:p-12 grain">
          <div className="bg-grid absolute inset-0 opacity-40" />
          <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-[100px]" />
          <div className="relative z-10 max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Featured build
            </span>
            <h3 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
              Go wide — full body kits & forged wheels.
            </h3>
            <p className="mt-3 text-muted-foreground">
              Liberty Walk, Rocket Bunny and BBS, professionally fitted with
              fitment support for Civic, Corolla, Supra and more.
            </p>
            <Button asChild className="mt-6" size="lg">
              <Link href="/shop?category=body-kits">
                Shop body kits <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </Section>

      {/* Latest */}
      <Section className="pt-0">
        <SectionHeading
          eyebrow="Just in"
          title="Latest arrivals"
          href="/shop?sort=newest"
        />
        <ProductGrid products={latest} />
      </Section>

      {/* Trust band */}
      <Section className="pt-0">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: BadgeCheck, title: "Genuine & OEM-grade", desc: "Sourced from trusted manufacturers with warranty." },
            { icon: Truck, title: "Pakistan-wide delivery", desc: "Fast dispatch with delivery or in-store pickup." },
            { icon: ShieldCheck, title: "Secure checkout", desc: "COD, pickup and online payment options." },
            { icon: Headphones, title: "Fitment support", desc: "We help you find the right part for your vehicle." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <f.icon className="size-6 text-primary" />
              <h4 className="mt-4 font-display font-semibold">{f.title}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
