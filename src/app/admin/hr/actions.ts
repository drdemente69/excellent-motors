"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { AttendanceStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

type State = { ok?: boolean; error?: string; message?: string } | undefined;

const employeeSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  employeeCode: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  baseSalary: z.coerce.number().min(0),
  joinedAt: z.string().optional(),
});

async function nextEmpCode() {
  const count = await prisma.employee.count();
  return `EMP-${String(count + 1).padStart(3, "0")}`;
}

export async function createEmployee(_prev: State, formData: FormData): Promise<State> {
  await requireRole("hr", "admin");
  const parsed = employeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;
  const code = d.employeeCode || (await nextEmpCode());
  const exists = await prisma.employee.findUnique({ where: { employeeCode: code } });
  if (exists) return { error: "That employee code already exists." };

  await prisma.employee.create({
    data: {
      employeeCode: code,
      fullName: d.fullName,
      email: d.email || null,
      phone: d.phone || null,
      position: d.position || null,
      department: d.department || null,
      baseSalary: d.baseSalary,
      joinedAt: d.joinedAt ? new Date(d.joinedAt) : null,
    },
  });
  revalidatePath("/admin/hr");
  redirect("/admin/hr?tab=employees");
}

/** Save attendance for a date. formData has `date` + employeeId→status pairs as att_<id>. */
export async function saveAttendance(formData: FormData): Promise<void> {
  await requireRole("hr", "admin");
  const dateStr = String(formData.get("date"));
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("att_")) continue;
    const employeeId = key.slice(4);
    const status = String(value) as AttendanceStatus;
    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: { employeeId, date, status },
      update: { status },
    });
  }
  revalidatePath("/admin/hr");
  redirect(`/admin/hr?tab=attendance&date=${dateStr}&saved=1`);
}

/** Generate payslips for all active employees for a period (YYYY-MM). */
export async function runPayroll(_prev: State, formData: FormData): Promise<State> {
  await requireRole("hr", "admin");
  const period = String(formData.get("period") || "");
  if (!/^\d{4}-\d{2}$/.test(period)) return { error: "Enter a valid period (YYYY-MM)." };

  const existing = await prisma.payrollRun.findUnique({ where: { period } });
  if (existing) return { error: `Payroll for ${period} already exists.` };

  const employees = await prisma.employee.findMany({ where: { isActive: true } });
  if (employees.length === 0) return { error: "No active employees to pay." };

  await prisma.payrollRun.create({
    data: {
      period,
      status: "processed",
      runAt: new Date(),
      payslips: {
        create: employees.map((e) => ({
          employeeId: e.id,
          baseSalary: e.baseSalary,
          allowances: 0,
          deductions: 0,
          netPay: e.baseSalary,
        })),
      },
    },
  });
  revalidatePath("/admin/hr");
  return { ok: true, message: `Payroll generated for ${period}` };
}

export async function markPayrollPaid(formData: FormData): Promise<void> {
  await requireRole("hr", "admin");
  const id = String(formData.get("id"));
  const run = await prisma.payrollRun.findUnique({ where: { id }, include: { payslips: true } });
  if (!run) return;
  await prisma.payrollRun.update({ where: { id }, data: { status: "paid" } });
  // Record total payroll as an operating expense.
  const total = run.payslips.reduce((s, p) => s + Number(p.netPay), 0);
  await prisma.expense.create({ data: { category: "Salaries", description: `Payroll ${run.period}`, amount: total } });
  await prisma.ledgerEntry.create({ data: { type: "expense", category: "Salaries", amount: total, memo: `Payroll ${run.period}` } });
  revalidatePath("/admin/hr");
  revalidatePath("/admin/accounts");
}
