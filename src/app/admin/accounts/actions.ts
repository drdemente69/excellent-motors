"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";

type State = { ok?: boolean; error?: string; message?: string } | undefined;

const expenseSchema = z.object({
  category: z.string().min(2, "Category is required"),
  description: z.string().optional(),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  date: z.string().optional(),
});

export async function createExpense(_prev: State, formData: FormData): Promise<State> {
  const user = await requireRole("accountant", "admin");
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  await prisma.expense.create({
    data: {
      category: d.category,
      description: d.description || null,
      amount: d.amount,
      date: d.date ? new Date(d.date) : new Date(),
      createdById: user.id,
    },
  });
  // Mirror into the ledger for cash-flow reporting.
  await prisma.ledgerEntry.create({
    data: { type: "expense", category: d.category, amount: d.amount, memo: d.description || "Expense" },
  });

  revalidatePath("/admin/accounts");
  return { ok: true, message: "Expense recorded" };
}

export async function deleteExpense(formData: FormData): Promise<void> {
  await requireRole("accountant", "admin");
  const id = String(formData.get("id"));
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/admin/accounts");
}
