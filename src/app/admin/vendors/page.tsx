import Link from "next/link";
import { Truck, Plus, ChevronRight } from "lucide-react";
import { getVendors } from "@/lib/queries/purchasing";
import { createVendor } from "@/app/admin/vendors/actions";
import { formatPKR } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { VendorForm } from "@/components/admin/vendor-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendors" };

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground">{vendors.length} suppliers · contacts, purchase history & balances</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus /> New vendor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add a vendor</DialogTitle>
            </DialogHeader>
            <VendorForm action={createVendor} mode="create" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((v) => (
          <Link key={v.id} href={`/admin/vendors/${v.id}`} className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
            <div className="flex items-start justify-between">
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Truck className="size-5" /></span>
              {!v.isActive && <Badge variant="secondary">Inactive</Badge>}
            </div>
            <div>
              <h3 className="font-display font-semibold tracking-tight group-hover:text-primary">{v.name}</h3>
              <p className="font-mono text-xs text-muted-foreground">{v.code}{v.contactName ? ` · ${v.contactName}` : ""}</p>
            </div>
            <div className="mt-auto grid grid-cols-3 gap-2 border-t border-border pt-3 text-center">
              <Stat label="POs" value={String(v.poCount)} />
              <Stat label="Purchased" value={formatPKR(v.totalPurchased)} />
              <Stat label="Owed" value={formatPKR(v.outstanding)} alert={v.outstanding > 0} />
            </div>
            <span className="flex items-center justify-end gap-1 text-xs text-primary opacity-0 transition-opacity group-hover:opacity-100">
              View <ChevronRight className="size-3.5" />
            </span>
          </Link>
        ))}
        {vendors.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">No vendors yet. Add your first supplier.</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div>
      <p className={`text-sm font-semibold ${alert ? "text-warning" : ""}`}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
