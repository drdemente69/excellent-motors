"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Package, MapPin, User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: User },
];

export function AccountNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-surface-2",
            )}
          >
            <l.icon className="size-4" />
            {l.label}
          </Link>
        );
      })}
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="mt-2 flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-destructive"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </nav>
  );
}
