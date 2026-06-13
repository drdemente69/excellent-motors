import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { PoBuilder } from "@/components/admin/po-builder";

export const dynamic = "force-dynamic";
export const metadata = { title: "New purchase order" };

export default async function NewPoPage({
  searchParams,
}: {
  searchParams: Promise<{ vendor?: string }>;
}) {
  const sp = await searchParams;
  const [vendors, products] = await Promise.all([
    prisma.vendor.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.product.findMany({ where: { status: { not: "archived" } }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/admin/purchasing" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to purchasing
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold tracking-tight">New purchase order</h1>
      {vendors.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          Add a vendor first on the <Link href="/admin/vendors" className="text-primary hover:underline">Vendors</Link> page.
        </p>
      ) : (
        <PoBuilder
          vendors={vendors.map((v) => ({ id: v.id, name: v.name }))}
          products={products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, cost: Number(p.cost) }))}
          initialVendorId={sp.vendor}
        />
      )}
    </div>
  );
}
