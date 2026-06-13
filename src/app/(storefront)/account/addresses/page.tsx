import { MapPin, Trash2, Star } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { deleteAddress } from "@/app/(storefront)/account/actions";
import { AddressForm } from "@/components/storefront/account/address-form";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser();
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Addresses</h1>

      {addresses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="relative rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{a.label ?? "Address"}</span>
                    {a.isDefault && (
                      <Badge variant="default"><Star className="size-3" /> Default</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {[a.line1, a.line2, a.city, a.province, a.postalCode].filter(Boolean).join(", ")}
                  </p>
                  {a.phone && <p className="text-muted-foreground">{a.phone}</p>}
                </div>
              </div>
              <form action={deleteAddress} className="absolute right-3 top-3">
                <input type="hidden" name="id" value={a.id} />
                <button
                  type="submit"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-destructive"
                  aria-label="Delete address"
                >
                  <Trash2 className="size-4" />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display font-semibold">Add a new address</h2>
        <AddressForm />
      </div>
    </div>
  );
}
