import { requireRole } from "@/lib/auth-helpers";
import { STAFF_ROLES } from "@/lib/constants";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole(...STAFF_ROLES);
  return (
    <AdminShell user={{ name: user.name, email: user.email, role: user.role }}>
      {children}
    </AdminShell>
  );
}
