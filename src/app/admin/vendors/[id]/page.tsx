import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Plus } from "lucide-react";
import { getVendor } from "@/lib/queries/purchasing";
import { updateVendor } from "@/app/admin/vendors/actions";
import { formatPKR, formatDateShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VendorForm } from "@/components/admin/vendor-form";
import { PO_STATUS_VARIANT } from "@/components/admin/po-status";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export const dynamic = "force-dynamic";
export const metadata = { title: "Vendor" };

export default async function VendorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const vendor = await getVendor(id);
  if (!vendor) notFound();

  const outstanding =
    vendor.purchaseOrders
      .filter((p) => p.status !== "cancelled")
      .reduce((s, p) => s + p.grandTotal - p.amountPaid, 0);

  return (
    <div className="flex flex-col gap-6">
      <Link href="/admin/vendors" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to vendors
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">{vendor.name}</h1>
          <p className="font-mono text-sm text-muted-foreground">{vendor.code}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href={`/admin/purchasing/new?vendor=${vendor.id}`}><Plus /> New PO</Link></Button>
          <Dialog>
            <DialogTrigger asChild><Button variant="secondary">Edit</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Edit vendor</DialogTitle></DialogHeader>
              <VendorForm
                action={updateVendor}
                mode="edit"
                defaults={{
                  id: vendor.id,
                  name: vendor.name,
                  contactName: vendor.contactName ?? "",
                  email: vendor.email ?? "",
                  phone: vendor.phone ?? "",
                  address: vendor.address ?? "",
                  taxId: vendor.taxId ?? "",
                  notes: vendor.notes ?? "",
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 text-sm lg:col-span-1">
          <h2 className="mb-3 font-display font-semibold">Contact</h2>
          <ul className="flex flex-col gap-2 text-muted-foreground">
            {vendor.contactName && <li>{vendor.contactName}</li>}
            {vendor.phone && <li className="flex items-center gap-2"><Phone className="size-4" /> {vendor.phone}</li>}
            {vendor.email && <li className="flex items-center gap-2"><Mail className="size-4" /> {vendor.email}</li>}
            {vendor.address && <li className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0" /> {vendor.address}</li>}
            {vendor.taxId && <li>NTN: {vendor.taxId}</li>}
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4">
            <div><p className="font-display text-lg font-bold">{vendor.purchaseOrders.length}</p><p className="text-xs text-muted-foreground">Purchase orders</p></div>
            <div><p className={`font-display text-lg font-bold ${outstanding > 0 ? "text-warning" : ""}`}>{formatPKR(outstanding)}</p><p className="text-xs text-muted-foreground">Outstanding</p></div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card lg:col-span-2">
          <h2 className="border-b border-border p-5 font-display font-semibold">Purchase history</h2>
          {vendor.purchaseOrders.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">No purchase orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 font-medium">PO</th><th className="px-5 py-3 font-medium">Date</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Total</th><th className="px-5 py-3 text-right font-medium">Paid</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vendor.purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-surface-2">
                    <td className="px-5 py-3"><Link href={`/admin/purchasing/${po.id}`} className="font-mono text-primary hover:underline">{po.poNumber}</Link></td>
                    <td className="px-5 py-3 text-muted-foreground">{formatDateShort(po.createdAt)}</td>
                    <td className="px-5 py-3"><Badge variant={PO_STATUS_VARIANT[po.status]}>{po.status.replace("_", " ")}</Badge></td>
                    <td className="px-5 py-3 text-right">{formatPKR(po.grandTotal)}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground">{formatPKR(po.amountPaid)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
