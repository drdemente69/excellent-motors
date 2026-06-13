import Link from "next/link";
import { Gauge } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import { PosHeaderActions } from "@/components/pos/pos-header-actions";

export default async function PosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("cashier", "admin");
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Gauge className="size-4.5" />
          </span>
          <span className="font-display text-sm font-bold tracking-tight">
            Excellent<span className="text-primary">Motors</span>
            <span className="ml-2 rounded bg-surface-2 px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground">POS</span>
          </span>
        </Link>
        <div className="ml-auto">
          <PosHeaderActions name={user.name ?? user.email ?? "Cashier"} />
        </div>
      </header>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
