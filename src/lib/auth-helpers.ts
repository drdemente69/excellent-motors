import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";

// Authoritative, server-side auth checks for pages, layouts and Server Actions.
// (The Proxy only does optimistic gating — always re-check here.)

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/forbidden");
  return user;
}
