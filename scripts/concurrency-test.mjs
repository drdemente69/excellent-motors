// Concurrency / oversell test.
//
// Proves the single most important guarantee: when the storefront and POS race
// to sell the SAME SKU, stock can NEVER go negative. We set a product to N
// units, then fire M >> N concurrent online orders (each qty 1) at the real
// /api/checkout endpoint — which decrements through the shared InventoryService
// (the same atomic path POS sales use). Exactly N must succeed; the rest must
// be rejected with 409; final stock must be exactly 0.
//
// Usage: node scripts/concurrency-test.mjs   (dev server must be running)

import { PrismaClient } from "@prisma/client";

const BASE = process.env.BASE_URL ?? "http://localhost:3020";
const STOCK = 5;
const ATTEMPTS = 25;
const prisma = new PrismaClient();

async function main() {
  const product = await prisma.product.findFirst({ where: { status: "active" }, include: { inventory: true } });
  if (!product) throw new Error("No product found — run the seed first.");
  const inv = product.inventory[0];
  const original = inv.quantity;

  // Arrange: set stock to exactly STOCK on the default warehouse, clear others.
  await prisma.inventory.update({ where: { id: inv.id }, data: { quantity: STOCK, reserved: 0 } });
  for (const other of product.inventory.slice(1)) {
    await prisma.inventory.update({ where: { id: other.id }, data: { quantity: 0 } });
  }

  console.log(`\n🏁  Racing ${ATTEMPTS} concurrent online orders for "${product.name}" (stock = ${STOCK})…\n`);

  const body = (i) => ({
    items: [{ productId: product.id, quantity: 1 }],
    customerName: `Race Buyer ${i}`,
    email: `race${i}@example.com`,
    phone: "+923001234567",
    fulfillment: "pickup",
    paymentMethod: "cash",
  });

  const results = await Promise.all(
    Array.from({ length: ATTEMPTS }, (_, i) =>
      fetch(`${BASE}/api/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body(i)),
      })
        .then((r) => r.status)
        .catch(() => 0),
    ),
  );

  const ok = results.filter((s) => s === 200).length;
  const conflict = results.filter((s) => s === 409).length;
  const other = results.filter((s) => s !== 200 && s !== 409).length;

  const finalAgg = await prisma.inventory.aggregate({ where: { productId: product.id }, _sum: { quantity: true } });
  const finalStock = finalAgg._sum.quantity ?? 0;

  console.log(`   ✅ succeeded : ${ok}`);
  console.log(`   ⛔ rejected  : ${conflict} (409 out of stock)`);
  if (other) console.log(`   ⚠️  other    : ${other}`);
  console.log(`   📦 final stock: ${finalStock}\n`);

  const pass = ok === STOCK && finalStock === 0 && finalStock >= 0 && other === 0;
  console.log(pass ? "🟢  PASS — no oversell, stock never went negative." : "🔴  FAIL — overselling detected!");

  // Cleanup: remove the race orders and restore original stock.
  await prisma.order.deleteMany({ where: { email: { startsWith: "race" } } });
  await prisma.stockMovement.deleteMany({ where: { reason: "Online order", product: { id: product.id }, reference: { startsWith: "EM-" } } });
  await prisma.inventory.update({ where: { id: inv.id }, data: { quantity: original } });
  console.log(`\n🧹  Cleaned up race orders; restored "${product.name}" stock to ${original}.`);

  await prisma.$disconnect();
  process.exit(pass ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
