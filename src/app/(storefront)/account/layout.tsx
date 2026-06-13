import { requireUser } from "@/lib/auth-helpers";
import { AccountNav } from "@/components/storefront/account/account-nav";
import { ROLE_LABELS } from "@/lib/constants";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-3 px-2">
              <span className="grid size-10 place-items-center rounded-full bg-primary/15 font-display font-bold text-primary">
                {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name ?? "Customer"}</p>
                <p className="truncate text-xs text-muted-foreground">{ROLE_LABELS[user.role]}</p>
              </div>
            </div>
            <AccountNav />
          </div>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
}
