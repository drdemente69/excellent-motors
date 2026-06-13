import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

// Generated per-request so it never needs the DB at build time.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3020";

  const products = await prisma.product.findMany({
    where: { status: "active" },
    select: { slug: true, updatedAt: true },
  });

  const staticRoutes: MetadataRoute.Sitemap = ["", "/shop", "/about", "/contact"].map(
    (path) => ({ url: `${base}${path}`, lastModified: new Date(), changeFrequency: "weekly", priority: path === "" ? 1 : 0.7 }),
  );

  const productRoutes: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes];
}
