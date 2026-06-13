"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { Role } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth-helpers";
import { ROLES } from "@/lib/constants";

type State = { ok?: boolean; error?: string; message?: string } | undefined;

const createUserSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(ROLES as [Role, ...Role[]]),
});

export async function createStaffUser(_prev: State, formData: FormData): Promise<State> {
  await requireRole("admin");
  const parsed = createUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  const d = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } });
  if (exists) return { error: "A user with that email already exists." };

  const passwordHash = await bcrypt.hash(d.password, 10);
  await prisma.user.create({ data: { name: d.name, email: d.email.toLowerCase(), role: d.role, passwordHash } });
  revalidatePath("/admin/users");
  return { ok: true, message: "User created" };
}

export async function updateUserRole(formData: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const id = String(formData.get("id"));
  const role = String(formData.get("role")) as Role;
  // Prevent self-demotion (avoid locking yourself out).
  if (id === admin.id && role !== "admin") return;
  await prisma.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
}

export async function toggleUserActive(formData: FormData): Promise<void> {
  const admin = await requireRole("admin");
  const id = String(formData.get("id"));
  const active = String(formData.get("active")) === "true";
  if (id === admin.id) return; // can't deactivate yourself
  await prisma.user.update({ where: { id }, data: { isActive: active } });
  revalidatePath("/admin/users");
}
