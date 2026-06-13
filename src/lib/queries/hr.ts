import { prisma } from "@/lib/db";

export async function getEmployees() {
  const rows = await prisma.employee.findMany({ orderBy: { fullName: "asc" } });
  return rows.map((e) => ({
    id: e.id,
    employeeCode: e.employeeCode,
    fullName: e.fullName,
    email: e.email,
    phone: e.phone,
    position: e.position,
    department: e.department,
    baseSalary: Number(e.baseSalary),
    isActive: e.isActive,
    joinedAt: e.joinedAt?.toISOString() ?? null,
  }));
}

/** Active employees + their attendance status for a given date (for marking). */
export async function getAttendanceForDate(dateStr: string) {
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  const next = new Date(date);
  next.setDate(date.getDate() + 1);

  const [employees, records] = await Promise.all([
    prisma.employee.findMany({ where: { isActive: true }, orderBy: { fullName: "asc" } }),
    prisma.attendance.findMany({ where: { date: { gte: date, lt: next } } }),
  ]);
  const byEmp = new Map(records.map((r) => [r.employeeId, r.status]));
  return employees.map((e) => ({
    id: e.id,
    fullName: e.fullName,
    position: e.position,
    status: byEmp.get(e.id) ?? "present",
  }));
}

export async function getPayrollRuns() {
  const runs = await prisma.payrollRun.findMany({
    orderBy: { period: "desc" },
    include: { payslips: { include: { employee: { select: { fullName: true } } } } },
  });
  return runs.map((r) => ({
    id: r.id,
    period: r.period,
    status: r.status,
    runAt: r.runAt?.toISOString() ?? null,
    count: r.payslips.length,
    total: r.payslips.reduce((s, p) => s + Number(p.netPay), 0),
    payslips: r.payslips.map((p) => ({
      id: p.id,
      employee: p.employee.fullName,
      baseSalary: Number(p.baseSalary),
      allowances: Number(p.allowances),
      deductions: Number(p.deductions),
      netPay: Number(p.netPay),
    })),
  }));
}
