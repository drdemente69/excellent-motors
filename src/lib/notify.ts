import { prisma } from "@/lib/db";

// Notifications seam: email (swappable provider) + in-app records.
// EMAIL_PROVIDER=console logs to the server terminal in dev. Swap to SMTP/Resend
// later by extending sendEmail().

type EmailMessage = {
  to: string;
  subject: string;
  body: string;
};

export async function sendEmail(msg: EmailMessage): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  if (provider === "console") {
    console.log(
      `\n📧  [email:${process.env.EMAIL_FROM ?? "no-reply"}] → ${msg.to}\n` +
        `    Subject: ${msg.subject}\n` +
        `    ${msg.body.replace(/\n/g, "\n    ")}\n`,
    );
    return;
  }
  // TODO: implement smtp / resend providers here.
  console.warn(`Email provider "${provider}" not implemented; logging instead.`);
  console.log(msg);
}

export async function createNotification(opts: {
  userId?: string | null;
  title: string;
  body: string;
  link?: string;
}): Promise<void> {
  await prisma.notification.create({
    data: {
      userId: opts.userId ?? undefined,
      title: opts.title,
      body: opts.body,
      link: opts.link,
    },
  });
}
