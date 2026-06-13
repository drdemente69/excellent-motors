import { requireUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/db";
import { ProfileForm, PasswordForm } from "@/components/storefront/account/profile-forms";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser();
  const record = await prisma.user.findUnique({
    where: { id: user.id },
    include: { customerProfile: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">Profile</h1>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display font-semibold">Personal details</h2>
        <ProfileForm
          name={record?.name ?? ""}
          email={record?.email ?? ""}
          phone={record?.customerProfile?.phone ?? ""}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-display font-semibold">Change password</h2>
        <PasswordForm />
      </div>
    </div>
  );
}
