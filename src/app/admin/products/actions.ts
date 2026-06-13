"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ProductStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { productSchema } from "@/lib/validations/product";
import { increaseStock, getDefaultWarehouseId } from "@/lib/inventory/service";
import { slugify } from "@/lib/utils";

type State = { error?: string } | undefined;

function parse(formData: FormData) {
  const raw = Object.fromEntries(formData);
  return productSchema.safeParse({
    ...raw,
    isFeatured: formData.get("isFeatured") === "on" || formData.get("isFeatured") === "true",
  });
}

export async function createProduct(_prev: State, formData: FormData): Promise<State> {
  const user = await requireRole("inventory_manager", "admin");
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  const existing = await prisma.product.findFirst({ where: { OR: [{ sku: d.sku }, { slug: slugify(d.name) }] } });
  if (existing) return { error: "A product with that SKU or name already exists." };

  const warehouseId = await getDefaultWarehouseId();
  const product = await prisma.product.create({
    data: {
      name: d.name,
      slug: slugify(d.name),
      sku: d.sku,
      barcode: d.barcode || null,
      partNumber: d.partNumber || null,
      oemNumber: d.oemNumber || null,
      price: d.price,
      cost: d.cost,
      taxRatePct: d.taxRatePct,
      status: d.status,
      isFeatured: Boolean(d.isFeatured),
      shortDesc: d.shortDesc || null,
      description: d.description || null,
      categoryId: d.categoryId,
      brandId: d.brandId || null,
      images: d.imageUrl ? { create: { url: d.imageUrl, alt: d.name, isPrimary: true } } : undefined,
      inventory: { create: { warehouseId, quantity: 0, reorderLevel: d.reorderLevel } },
    },
  });

  // Initial stock goes through the shared service so it's audited + broadcast.
  if (d.initialStock && d.initialStock > 0) {
    await increaseStock([{ productId: product.id, quantity: d.initialStock }], {
      type: "initial",
      reason: "Initial stock (product created)",
      actorId: user.id,
    });
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function updateProduct(_prev: State, formData: FormData): Promise<State> {
  await requireRole("inventory_manager", "admin");
  const id = String(formData.get("id"));
  const parsed = parse(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  await prisma.product.update({
    where: { id },
    data: {
      name: d.name,
      sku: d.sku,
      barcode: d.barcode || null,
      partNumber: d.partNumber || null,
      oemNumber: d.oemNumber || null,
      price: d.price,
      cost: d.cost,
      taxRatePct: d.taxRatePct,
      status: d.status,
      isFeatured: Boolean(d.isFeatured),
      shortDesc: d.shortDesc || null,
      description: d.description || null,
      categoryId: d.categoryId,
      brandId: d.brandId || null,
    },
  });

  // Update reorder level on the default warehouse inventory.
  const warehouseId = await getDefaultWarehouseId();
  await prisma.inventory.updateMany({
    where: { productId: id, warehouseId },
    data: { reorderLevel: d.reorderLevel },
  });

  if (d.imageUrl) {
    const primary = await prisma.productImage.findFirst({ where: { productId: id, isPrimary: true } });
    if (primary) await prisma.productImage.update({ where: { id: primary.id }, data: { url: d.imageUrl } });
    else await prisma.productImage.create({ data: { productId: id, url: d.imageUrl, alt: d.name, isPrimary: true } });
  }

  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export async function setProductStatus(formData: FormData): Promise<void> {
  await requireRole("inventory_manager", "admin");
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as ProductStatus;
  await prisma.product.update({ where: { id }, data: { status } });
  revalidatePath("/admin/products");
}
