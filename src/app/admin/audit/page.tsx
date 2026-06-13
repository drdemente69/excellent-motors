import { ScrollText } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";
export const metadata = { title: "Audit log" };

export default async function AuditPage() {
  await requireRole("admin");
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { name: true, email: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold tracking-tight">
          <ScrollText className="size-6 text-primary" /> Audit log
        </h1>
        <p className="text-sm text-muted-foreground">A record of sensitive actions across the system.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-5 py-3 font-medium">When</th><th className="px-5 py-3 font-medium">Actor</th><th className="px-5 py-3 font-medium">Action</th><th className="px-5 py-3 font-medium">Entity</th><th className="px-5 py-3 font-medium">Details</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-surface-2">
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{formatDateTime(l.createdAt)}</td>
                  <td className="px-5 py-3">{l.actor?.name ?? l.actor?.email ?? "System"}</td>
                  <td className="px-5 py-3"><Badge variant="secondary">{l.action}</Badge></td>
                  <td className="px-5 py-3 text-muted-foreground">{l.entity ?? "—"}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{l.metadata ?? ""}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No audit entries yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
