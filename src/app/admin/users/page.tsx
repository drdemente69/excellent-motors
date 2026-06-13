import { UserCheck, UserX } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { toggleUserActive } from "@/app/admin/users/actions";
import { formatDateShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { UserCreateForm, UserRoleSelect } from "@/components/admin/user-forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Users" };

export default async function UsersPage() {
  const me = await requireRole("admin");
  const users = await prisma.user.findMany({ orderBy: [{ role: "asc" }, { createdAt: "asc" }] });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">User management</h1>
        <p className="text-sm text-muted-foreground">Roles and access for staff and customers.</p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr><th className="px-5 py-3 font-medium">User</th><th className="px-5 py-3 font-medium">Role</th><th className="px-5 py-3 font-medium">Joined</th><th className="px-5 py-3 font-medium">Status</th><th className="px-5 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-2">
                  <td className="px-5 py-3"><p className="font-medium">{u.name ?? "—"}{u.id === me.id && <span className="ml-2 text-xs text-primary">(you)</span>}</p><p className="text-xs text-muted-foreground">{u.email}</p></td>
                  <td className="px-5 py-3"><UserRoleSelect userId={u.id} role={u.role} disabled={u.id === me.id} /></td>
                  <td className="px-5 py-3 whitespace-nowrap text-muted-foreground">{formatDateShort(u.createdAt)}</td>
                  <td className="px-5 py-3"><Badge variant={u.isActive ? "success" : "destructive"}>{u.isActive ? "Active" : "Disabled"}</Badge></td>
                  <td className="px-5 py-3 text-right">
                    {u.id !== me.id && (
                      <form action={toggleUserActive}>
                        <input type="hidden" name="id" value={u.id} />
                        <input type="hidden" name="active" value={String(!u.isActive)} />
                        <button type="submit" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground" aria-label="Toggle active">
                          {u.isActive ? <><UserX className="size-4" /> Disable</> : <><UserCheck className="size-4" /> Enable</>}
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 font-display font-semibold">Create staff user</h2>
        <UserCreateForm />
      </div>
    </div>
  );
}
