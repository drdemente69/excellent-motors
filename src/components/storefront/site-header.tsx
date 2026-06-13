"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, Search, User, Gauge, LogOut, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { CartDrawer } from "@/components/storefront/cart-drawer";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { STOREFRONT_NAV, ROLE_HOME, STAFF_ROLES } from "@/lib/constants";
import { t } from "@/lib/strings";

function SearchBar({ onSubmit }: { onSubmit?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
        onSubmit?.();
      }}
      className="relative w-full"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search part #, OEM, brand…"
        className="pl-9"
        aria-label="Search parts"
      />
    </form>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const role = session?.user?.role;
  const isStaff = role && STAFF_ROLES.includes(role);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "glass border-b border-border/70"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader>
              <SheetTitle className="font-display">Excellent Motors</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-1 p-5">
              <div className="mb-3">
                <SearchBar />
              </div>
              {STOREFRONT_NAV.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-surface-2"
                  >
                    {t(item.labelKey)}
                  </Link>
                </SheetClose>
              ))}
            </div>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Gauge className="size-5" />
          </span>
          <span className="hidden font-display text-lg font-bold tracking-tight sm:block">
            Excellent<span className="text-primary">Motors</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {STOREFRONT_NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-foreground/80 hover:text-foreground",
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* Search (desktop) */}
        <div className="ml-auto hidden max-w-xs flex-1 md:block">
          <SearchBar />
        </div>

        {/* Cart + account */}
        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />
          {session?.user && <NotificationBell />}
          <CartDrawer />

          {session?.user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <User />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {session.user.name ?? session.user.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <LayoutDashboard /> My account
                  </Link>
                </DropdownMenuItem>
                {isStaff && (
                  <DropdownMenuItem asChild>
                    <Link href={ROLE_HOME[role]}>
                      <Gauge /> Back office
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/" })}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild className="hidden sm:flex">
                <Link href="/login">Login</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
