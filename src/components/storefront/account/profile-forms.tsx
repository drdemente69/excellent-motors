"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateProfile, changePassword } from "@/app/(storefront)/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="self-start">
      {pending && <Loader2 className="animate-spin" />} {label}
    </Button>
  );
}

export function ProfileForm({ name, email, phone }: { name: string; email: string; phone: string }) {
  const [state, action] = useActionState(updateProfile, undefined);
  useEffect(() => {
    if (state?.ok) toast.success(state.message ?? "Saved");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" name="name" defaultValue={name} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={phone} placeholder="+92 3XX XXXXXXX" />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label>Email</Label>
          <Input value={email} disabled />
        </div>
      </div>
      <SaveButton label="Save changes" />
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  useEffect(() => {
    if (state?.ok) toast.success(state.message ?? "Password changed");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="current">Current password</Label>
          <Input id="current" name="current" type="password" autoComplete="current-password" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="next">New password</Label>
          <Input id="next" name="next" type="password" autoComplete="new-password" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="confirm">Confirm</Label>
          <Input id="confirm" name="confirm" type="password" autoComplete="new-password" />
        </div>
      </div>
      <SaveButton label="Change password" />
    </form>
  );
}
