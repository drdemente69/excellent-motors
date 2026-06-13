import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { updateProduct } from "@/app/admin/products/actions";
import { ProductForm } from "@/components/admin/product-form";
import { getDefaultWarehouseId } from "@/lib/inventory/service";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit product" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [product, categories, brands, warehouseId] = await Promise.all([
    prisma.product.findUnique({
      where: { id },
      include: { images: { where: { isPrimary: true } }, inventory: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    getDefaultWarehouseId(),
  ]);
  if (!product) notFound();

  const defaultInv = product.inventory.find((i) => i.warehouseId === warehouseId) ?? product.inventory[0];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <h1 className="mb-1 font-display text-2xl font-bold tracking-tight">Edit product</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Adjust stock levels from the <Link href="/admin/stock" className="text-primary hover:underline">Stock</Link> page.
      </p>
      <ProductForm
        action={updateProduct}
        mode="edit"
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        defaults={{
          id: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode ?? "",
          partNumber: product.partNumber ?? "",
          oemNumber: product.oemNumber ?? "",
          categoryId: product.categoryId,
          brandId: product.brandId ?? "",
          price: Number(product.price),
          cost: Number(product.cost),
          taxRatePct: Number(product.taxRatePct),
          status: product.status,
          isFeatured: product.isFeatured,
          shortDesc: product.shortDesc ?? "",
          description: product.description ?? "",
          imageUrl: product.images[0]?.url ?? "",
          reorderLevel: defaultInv?.reorderLevel ?? 5,
        }}
      />
    </div>
  );
}
