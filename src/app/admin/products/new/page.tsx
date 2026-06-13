import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { createProduct } from "@/app/admin/products/actions";
import { ProductForm } from "@/components/admin/product-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, brands] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to products
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight">New product</h1>
      <ProductForm
        action={createProduct}
        mode="create"
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
      />
    </div>
  );
}
