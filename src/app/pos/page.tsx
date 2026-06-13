import { requireRole } from "@/lib/auth-helpers";
import { getPosProducts } from "@/lib/queries/pos";
import { getCategoriesWithCounts } from "@/lib/queries/catalog";
import { listHeldSales } from "@/lib/pos/service";
import { getSettings } from "@/lib/settings";
import { PosTerminal } from "@/components/pos/pos-terminal";

export const dynamic = "force-dynamic";
export const metadata = { title: "Point of Sale" };

export default async function PosPage() {
  const user = await requireRole("cashier", "admin");
  const [products, categories, held, settings] = await Promise.all([
    getPosProducts(),
    getCategoriesWithCounts(),
    listHeldSales(),
    getSettings(),
  ]);

  return (
    <PosTerminal
      products={products}
      categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
      heldSales={held}
      cashierName={user.name ?? user.email ?? "Cashier"}
      business={{
        name: settings.businessName,
        address: settings.address,
        phone: settings.phone,
        ntn: settings.ntn,
        taxRate: settings.taxRatePct,
      }}
    />
  );
}
