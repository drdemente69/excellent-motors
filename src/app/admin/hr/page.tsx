import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { requireRole } from "@/lib/auth-helpers";
import { getEmployees, getAttendanceForDate, getPayrollRuns } from "@/lib/queries/hr";
import { saveAttendance, markPayrollPaid } from "@/app/admin/hr/actions";
import { formatPKR, formatDateShort } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmployeeForm, PayrollRunForm, AttendanceDatePicker } from "@/components/admin/hr-forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "HR & Payroll" };

const TABS = [
  { id: "employees", label: "Employees" },
  { id: "attendance", label: "Attendance" },
  { id: "payroll", label: "Payroll" },
];

const ATT_STATUSES = ["present", "absent", "leave", "half_day"];

export default async function HrPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string; saved?: string }>;
}) {
  await requireRole("hr", "admin");
  const sp = await searchParams;
  const tab = sp.tab ?? "employees";
  const date = sp.date ?? new Date().toISOString().slice(0, 10);

  const [employees, attendance, payroll] = await Promise.all([
    getEmployees(),
    tab === "attendance" ? getAttendanceForDate(date) : Promise.resolve([]),
    tab === "payroll" ? getPayrollRuns() : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">HR &amp; Payroll</h1>
        <p className="text-sm text-muted-foreground">Employees, attendance and salary processing.</p>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link key={t.id} href={`/admin/hr?tab=${t.id}`} className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "employees" && (
        <div className="flex flex-col gap-6">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 font-medium">Employee</th><th className="px-5 py-3 font-medium">Position</th><th className="px-5 py-3 font-medium">Department</th><th className="px-5 py-3 text-right font-medium">Salary</th><th className="px-5 py-3 font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map((e) => (
                  <tr key={e.id} className="hover:bg-surface-2">
                    <td className="px-5 py-3"><p className="font-medium">{e.fullName}</p><p className="font-mono text-xs text-muted-foreground">{e.employeeCode}</p></td>
                    <td className="px-5 py-3 text-muted-foreground">{e.position ?? "—"}</td>
                    <td className="px-5 py-3 text-muted-foreground">{e.department ?? "—"}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatPKR(e.baseSalary)}</td>
                    <td className="px-5 py-3"><Badge variant={e.isActive ? "success" : "secondary"}>{e.isActive ? "Active" : "Inactive"}</Badge></td>
                  </tr>
                ))}
                {employees.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-muted-foreground">No employees yet.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display font-semibold">Add employee</h2>
            <EmployeeForm />
          </div>
        </div>
      )}

      {tab === "attendance" && (
        <div className="flex flex-col gap-4">
          {sp.saved && (
            <div className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-2.5 text-sm text-success">
              <CheckCircle2 className="size-4" /> Attendance saved for {formatDateShort(date)}.
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Date</span>
            <AttendanceDatePicker date={date} />
          </div>
          <form action={saveAttendance} className="overflow-hidden rounded-xl border border-border bg-card">
            <input type="hidden" name="date" value={date} />
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-surface-2 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <tr><th className="px-5 py-3 font-medium">Employee</th><th className="px-5 py-3 font-medium">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {attendance.map((a) => (
                  <tr key={a.id}>
                    <td className="px-5 py-3"><p className="font-medium">{a.fullName}</p><p className="text-xs text-muted-foreground">{a.position}</p></td>
                    <td className="px-5 py-3">
                      <select name={`att_${a.id}`} defaultValue={a.status} className="h-9 rounded-lg border border-input bg-surface px-3 text-sm capitalize">
                        {ATT_STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && <tr><td colSpan={2} className="px-5 py-10 text-center text-muted-foreground">No active employees.</td></tr>}
              </tbody>
            </table>
            {attendance.length > 0 && (
              <div className="border-t border-border p-4"><Button type="submit">Save attendance</Button></div>
            )}
          </form>
        </div>
      )}

      {tab === "payroll" && (
        <div className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 font-display font-semibold">Run payroll</h2>
            <PayrollRunForm />
          </div>
          {payroll.map((run) => (
            <div key={run.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
                <div>
                  <h3 className="font-display font-semibold">Payroll {run.period}</h3>
                  <p className="text-xs text-muted-foreground">{run.count} payslips · {formatPKR(run.total)} total</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={run.status === "paid" ? "success" : "warning"}>{run.status}</Badge>
                  {run.status !== "paid" && (
                    <form action={markPayrollPaid}>
                      <input type="hidden" name="id" value={run.id} />
                      <Button type="submit" size="sm">Mark paid</Button>
                    </form>
                  )}
                </div>
              </div>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr><th className="px-5 py-2.5 font-medium">Employee</th><th className="px-5 py-2.5 text-right font-medium">Base</th><th className="px-5 py-2.5 text-right font-medium">Net pay</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {run.payslips.map((p) => (
                    <tr key={p.id}><td className="px-5 py-2.5">{p.employee}</td><td className="px-5 py-2.5 text-right text-muted-foreground">{formatPKR(p.baseSalary)}</td><td className="px-5 py-2.5 text-right font-medium">{formatPKR(p.netPay)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {payroll.length === 0 && <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No payroll runs yet.</p>}
        </div>
      )}
    </div>
  );
}
