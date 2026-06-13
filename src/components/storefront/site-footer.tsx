import Link from "next/link";
import { Gauge, Mail, Phone, MapPin } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { getCategoriesWithCounts } from "@/lib/queries/catalog";

export async function SiteFooter() {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategoriesWithCounts(),
  ]);

  return (
    <footer className="relative mt-24 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Gauge className="size-5" />
            </span>
            <span className="font-display text-lg font-bold tracking-tight">
              Excellent<span className="text-primary">Motors</span>
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Genuine and performance car parts in Pakistan — engineered quality,
            live stock and fast delivery.
          </p>
        </div>

        <div>
          <h4 className="mb-4 font-display text-sm font-semibold">Shop</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link href={`/shop?category=${c.slug}`} className="hover:text-primary">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-display text-sm font-semibold">Company</h4>
          <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
            <li><Link href="/about" className="hover:text-primary">About us</Link></li>
            <li><Link href="/shop" className="hover:text-primary">All parts</Link></li>
            <li><Link href="/contact" className="hover:text-primary">Contact</Link></li>
            <li><Link href="/account" className="hover:text-primary">My account</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-display text-sm font-semibold">Visit us</h4>
          <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              {settings.address}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="size-4 shrink-0 text-primary" />
              <a href={`tel:${settings.phone}`} className="hover:text-primary">
                {settings.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="size-4 shrink-0 text-primary" />
              <a href={`mailto:${settings.email}`} className="hover:text-primary">
                {settings.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <span>
            © {new Date().getFullYear()} {settings.businessName}. All rights reserved.
          </span>
          <span>Prices in PKR · GST {settings.taxRatePct}% · NTN {settings.ntn}</span>
        </div>
      </div>
    </footer>
  );
}
