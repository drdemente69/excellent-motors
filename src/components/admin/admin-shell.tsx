"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  ScanLine,
  ShoppingCart,
  Package,
  Boxes,
  RotateCcw,
  Gauge,
  Menu,
  LogOut,
  ShoppingBag,
  Truck,
  Users,
  Wallet,
  BarChart3,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { RealtimeIndicator } from "@/components/admin/realtime-indicator";
import { NotificationBell } from "@/components/notification-bell";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
};

const NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pos", label: "Point of Sale", icon: ScanLine, roles: ["cashier", "admin"] },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart, roles: ["cashier", "inventory_manager", "admin"] },
  { href: "/admin/products", label: "Products", icon: Package, roles: ["inventory_manager", "admin"] },
  { href: "/admin/stock", label: "Stock", icon: Boxes, roles: ["inventory_manager", "admin"] },
  { href: "/admin/purchasing", label: "Purchasing", icon: ShoppingBag, roles: ["inventory_manager", "admin"] },
  { href: "/admin/vendors", label: "Vendors", icon: Truck, roles: ["inventory_manager", "admin"] },
  { href: "/admin/returns", label: "Returns", icon: RotateCcw, roles: ["cashier", "inventory_manager", "admin"] },
  { href: "/admin/accounts", label: "Accounts", icon: Wallet, roles: ["accountant", "admin"] },
  { href: "/admin/reports", label: "Reports", icon: BarChart3, roles: ["accountant", "admin"] },
  { href: "/admin/hr", label: "HR & Payroll", icon: Users, roles: ["hr", "admin"] },
  { href: "/admin/users", label: "Users", icon: ShieldCheck, roles: ["admin"] },
  { href: "/admin/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];

function SidebarContent({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV.filter((n) => !n.roles || n.roles.includes(role));

  return (
    <div className="flex h-full flex-col">
      <Link href="/admin" className="flex items-center gap-2 px-5 py-5" onClick={onNavigate}>
        <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Gauge className="size-5" />
        </span>
        <div className="leading-tight">
          <span className="block font-display text-sm font-bold tracking-tight">
            Excellent<span className="text-primary">Motors</span>
          </span>
          <span className="text-[11px] text-muted-foreground">Back office</span>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {items.map((item) => {
          const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary/10 text-primary" : "text-foreground/80 hover:bg-surface-2",
              )}
            >
              <item.icon className="size-4.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 px-2 text-xs text-muted-foreground">{ROLE_LABELS[role]}</div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-surface-2 hover:text-destructive"
        >
          <LogOut className="size-4.5" /> Sign out
        </button>
      </div>
    </div>
  );
}

export function AdminShell({
  user,
  children,
}: {
  user: { name?: string | null; email?: string | null; role: Role };
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface lg:block">
        <SidebarContent role={user.role} />
      </aside>

      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur sm:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarContent role={user.role} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Storefront
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <RealtimeIndicator />
            <NotificationBell />
            <ThemeToggle />
            <div className="hidden items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 sm:flex">
              <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
              </span>
              <span className="text-xs font-medium">{user.name ?? user.email}</span>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
