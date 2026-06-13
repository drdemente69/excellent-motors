import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { STAFF_ROLES } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Returns the current user's in-app notifications (+ global staff alerts for
// staff), with an unread count.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isStaff = STAFF_ROLES.includes(session.user.role);
  const where = isStaff
    ? { OR: [{ userId: session.user.id }, { userId: null }] }
    : { userId: session.user.id };

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.notification.count({ where: { ...where, read: false } }),
  ]);

  return NextResponse.json({
    unread,
    items: items.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      link: n.link,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

// Mark all of the user's notifications read.
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const isStaff = STAFF_ROLES.includes(session.user.role);
  const where = isStaff
    ? { OR: [{ userId: session.user.id }, { userId: null }], read: false }
    : { userId: session.user.id, read: false };
  await prisma.notification.updateMany({ where, data: { read: true } });
  return NextResponse.json({ ok: true });
}
