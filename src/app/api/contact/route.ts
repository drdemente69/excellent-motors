import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validations/contact";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";
import { enforceRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "contact", 5, 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  await prisma.contactMessage.create({
    data: {
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      subject: d.subject,
      message: d.message,
    },
  });

  // Surface to staff inbox (admin notification feed).
  await createNotification({
    title: `New enquiry: ${d.subject}`,
    body: `${d.name} (${d.email}) — ${d.message.slice(0, 120)}`,
  });

  return NextResponse.json({ ok: true });
}
