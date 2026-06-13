import Link from "next/link";
import { Plus, Pencil, Archive, ArchiveRestore } from "lucide-react";
import type { ProductStatus } from "@prisma/client";
import { getAdminProducts } from "@/lib/queries/admin";
import { setProductStatus } from "@/app/admin/products/actions";
import { formatPKR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminSearch } from "@/components/admin/admin-search";

export const dynamic = "force-dynamic";
export const metadata = { title: "Products" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const products = await getAdminProducts({
    q: sp.q,
    status: sp.status as ProductStatus | undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">{products.length} products · manage catalogue & inventory</p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new"><Plus /> New product</Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearch base="/admin/products" placeholder="Search name, SKU, barcode…" />
        <div className="flex gap-1 text-sm">
          {[
            { label: "All", value: "" },
            { label: "Active", value: "active" },
            { label: "Draft", value: "draft" },
            { label: "Archived", value: "archived" },
          ].map((f) => (
            <Link
              key={f.value}
              href={`/admin/products${f.value ? `?status=${f.value}` : ""}`}
              className={`rounded-lg px-3 py-2 ${(sp.status ?? "") === f.value ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-surface-2"}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-center font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((p) => {
                const out = p.stock <= 0;
                const low = !out && p.stock <= p.reorder;
                return (
                  <tr key={p.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.name}</p>
                      <p className="font-mono text-xs text-muted-foreground">{p.sku}{p.barcode ? ` · ${p.barcode}` : ""}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{p.category}{p.brand ? ` · ${p.brand}` : ""}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPKR(p.price)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={out ? "destructive" : low ? "warning" : "success"}>{p.stock}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" aria-label="Edit">
                          <Link href={`/admin/products/${p.id}`}><Pencil className="size-4" /></Link>
                        </Button>
                        <form action={setProductStatus}>
                          <input type="hidden" name="id" value={p.id} />
                          <input type="hidden" name="status" value={p.status === "archived" ? "active" : "archived"} />
                          <Button variant="ghost" size="icon" type="submit" aria-label="Toggle archive">
                            {p.status === "archived" ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                          </Button>
                        </form>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {products.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
