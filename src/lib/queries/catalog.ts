import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

// Serializable shapes handed to client components (Decimal -> number).

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  partNumber: string | null;
  oemNumber: string | null;
  price: number;
  brand: string | null;
  category: string;
  categorySlug: string;
  image: string;
  isFeatured: boolean;
  available: number;
  reorderLevel: number;
};

export type ProductDetail = ProductCard & {
  description: string | null;
  shortDesc: string | null;
  cost: number;
  taxRatePct: number;
  model3dUrl: string | null;
  brandSlug: string | null;
  images: { url: string; alt: string | null }[];
  fitments: { make: string; model: string; years: string; variant: string | null }[];
};

const cardInclude = {
  brand: true,
  category: true,
  images: { orderBy: { sortOrder: "asc" } },
  inventory: true,
} satisfies Prisma.ProductInclude;

type ProductWithRels = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

function available(p: ProductWithRels): number {
  return p.inventory.reduce((sum, i) => sum + (i.quantity - i.reserved), 0);
}

function reorder(p: ProductWithRels): number {
  return p.inventory.reduce((m, i) => Math.max(m, i.reorderLevel), 0);
}

function toCard(p: ProductWithRels): ProductCard {
  const primary = p.images.find((i) => i.isPrimary) ?? p.images[0];
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    partNumber: p.partNumber,
    oemNumber: p.oemNumber,
    price: Number(p.price),
    brand: p.brand?.name ?? null,
    category: p.category.name,
    categorySlug: p.category.slug,
    image: primary?.url ?? "/placeholders/accessories.svg",
    isFeatured: p.isFeatured,
    available: available(p),
    reorderLevel: reorder(p),
  };
}

export async function getFeaturedProducts(limit = 8): Promise<ProductCard[]> {
  const rows = await prisma.product.findMany({
    where: { status: "active", isFeatured: true },
    include: cardInclude,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toCard);
}

export async function getLatestProducts(limit = 8): Promise<ProductCard[]> {
  const rows = await prisma.product.findMany({
    where: { status: "active" },
    include: cardInclude,
    take: limit,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toCard);
}

export async function getCategoriesWithCounts() {
  const cats = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return cats.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    description: c.description,
    count: c._count.products,
  }));
}

export async function getBrands() {
  return prisma.brand.findMany({ orderBy: { name: "asc" } });
}

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
  const p = await prisma.product.findUnique({
    where: { slug },
    include: {
      ...cardInclude,
      fitments: { include: { vehicle: true } },
    },
  });
  if (!p) return null;
  const card = toCard(p);
  return {
    ...card,
    description: p.description,
    shortDesc: p.shortDesc,
    cost: Number(p.cost),
    taxRatePct: Number(p.taxRatePct),
    model3dUrl: p.model3dUrl,
    brandSlug: p.brand?.slug ?? null,
    images: p.images.map((i) => ({ url: i.url, alt: i.alt })),
    fitments: p.fitments.map((f) => ({
      make: f.vehicle.make,
      model: f.vehicle.model,
      years: `${f.vehicle.yearStart}–${f.vehicle.yearEnd}`,
      variant: f.vehicle.variant,
    })),
  };
}

export type CatalogFilters = {
  q?: string;
  category?: string; // slug
  brand?: string; // slug
  minPrice?: number;
  maxPrice?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "name";
  make?: string;
  model?: string;
  year?: number;
  page?: number;
  perPage?: number;
};

export async function getCatalog(filters: CatalogFilters) {
  const perPage = filters.perPage ?? 12;
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.ProductWhereInput = { status: "active" };
  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { partNumber: { contains: filters.q, mode: "insensitive" } },
      { oemNumber: { contains: filters.q, mode: "insensitive" } },
      { sku: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }
  if (filters.category) where.category = { slug: filters.category };
  if (filters.brand) where.brand = { slug: filters.brand };
  if (filters.minPrice != null || filters.maxPrice != null) {
    where.price = {};
    if (filters.minPrice != null) where.price.gte = filters.minPrice;
    if (filters.maxPrice != null) where.price.lte = filters.maxPrice;
  }
  if (filters.make || filters.model || filters.year) {
    where.fitments = {
      some: {
        vehicle: {
          ...(filters.make ? { make: filters.make } : {}),
          ...(filters.model ? { model: filters.model } : {}),
          ...(filters.year
            ? { yearStart: { lte: filters.year }, yearEnd: { gte: filters.year } }
            : {}),
        },
      },
    };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    filters.sort === "price_asc"
      ? { price: "asc" }
      : filters.sort === "price_desc"
        ? { price: "desc" }
        : filters.sort === "name"
          ? { name: "asc" }
          : { createdAt: "desc" };

  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: cardInclude,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: rows.map(toCard),
    total,
    page,
    perPage,
    pages: Math.max(1, Math.ceil(total / perPage)),
  };
}

/** Make -> Model -> Years for the vehicle-fitment selector. */
export async function getVehicleTaxonomy() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: [{ make: "asc" }, { model: "asc" }, { yearStart: "desc" }],
  });
  const makes = new Map<string, Map<string, Set<number>>>();
  for (const v of vehicles) {
    if (!makes.has(v.make)) makes.set(v.make, new Map());
    const models = makes.get(v.make)!;
    if (!models.has(v.model)) models.set(v.model, new Set());
    const years = models.get(v.model)!;
    for (let y = v.yearStart; y <= v.yearEnd; y++) years.add(y);
  }
  return Array.from(makes.entries()).map(([make, models]) => ({
    make,
    models: Array.from(models.entries()).map(([model, years]) => ({
      model,
      years: Array.from(years).sort((a, b) => b - a),
    })),
  }));
}
