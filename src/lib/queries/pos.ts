import { prisma } from "@/lib/db";

export type PosProduct = {
  id: string;
  name: string;
  sku: string;
  barcode: string | null;
  partNumber: string | null;
  price: number;
  taxRatePct: number;
  category: string;
  available: number;
};

/** All sellable products with live availability, for the POS search/grid. */
export async function getPosProducts(): Promise<PosProduct[]> {
  const products = await prisma.product.findMany({
    where: { status: "active" },
    include: { inventory: true, category: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    barcode: p.barcode,
    partNumber: p.partNumber,
    price: Number(p.price),
    taxRatePct: Number(p.taxRatePct),
    category: p.category.name,
    available: p.inventory.reduce((s, i) => s + (i.quantity - i.reserved), 0),
  }));
}
