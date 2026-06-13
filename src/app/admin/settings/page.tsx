import Link from "next/link";
import { ScrollText, Database } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/settings-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireRole("admin");
  const settings = await getSettings();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">System settings</h1>
        <p className="text-sm text-muted-foreground">Business profile, tax and inventory controls.</p>
      </div>

      <SettingsForm settings={settings} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link href="/admin/audit" className="group flex items-center gap-3 rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/40">
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><ScrollText className="size-5" /></span>
          <div>
            <p className="font-medium group-hover:text-primary">Audit log</p>
            <p className="text-xs text-muted-foreground">Who did what, and when</p>
          </div>
        </Link>
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-5">
          <span className="grid size-10 place-items-center rounded-lg bg-accent/10 text-accent"><Database className="size-5" /></span>
          <div>
            <p className="font-medium">Backups</p>
            <p className="text-xs text-muted-foreground">pg_dump nightly — see README</p>
          </div>
        </div>
      </div>
    </div>
  );
}
