"use client";

import { useActionState, useEffect, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import type { Role } from "@prisma/client";
import { createStaffUser, updateUserRole } from "@/app/admin/users/actions";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = { ok?: boolean; error?: string; message?: string } | undefined;

const selectCls = "h-9 rounded-lg border border-input bg-surface px-3 text-sm";

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <UserPlus />} Create user</Button>;
}

export function UserCreateForm() {
  const [state, action] = useActionState<State, FormData>(createStaffUser, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) { toast.success(state.message ?? "Created"); ref.current?.reset(); }
    else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={ref} action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-1.5"><Label htmlFor="name">Name</Label><Input id="name" name="name" required /></div>
      <div className="flex flex-col gap-1.5"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" required /></div>
      <div className="flex flex-col gap-1.5"><Label htmlFor="password">Password</Label><Input id="password" name="password" type="password" required /></div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="role">Role</Label>
        <select id="role" name="role" defaultValue="cashier" className="h-11 rounded-lg border border-input bg-surface px-3.5 text-sm">
          {ROLES.filter((r) => r !== "customer").map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2"><Submit /></div>
    </form>
  );
}

export function UserRoleSelect({ userId, role, disabled }: { userId: string; role: Role; disabled?: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <select
      defaultValue={role}
      disabled={disabled || pending}
      onChange={(e) => {
        const fd = new FormData();
        fd.set("id", userId);
        fd.set("role", e.target.value);
        start(async () => { await updateUserRole(fd); router.refresh(); });
      }}
      className={selectCls}
    >
      {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
    </select>
  );
}
