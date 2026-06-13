"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserPlus, Play } from "lucide-react";
import { createEmployee, runPayroll } from "@/app/admin/hr/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = { ok?: boolean; error?: string; message?: string } | undefined;

function Submit({ label, icon }: { label: string; icon: React.ReactNode }) {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : icon} {label}</Button>;
}

export function EmployeeForm() {
  const [state, action] = useActionState<State, FormData>(createEmployee, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {state?.error && <p className="sm:col-span-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">{state.error}</p>}
      <Field label="Full name" name="fullName" required />
      <Field label="Code (auto if blank)" name="employeeCode" mono />
      <Field label="Position" name="position" />
      <Field label="Department" name="department" />
      <Field label="Phone" name="phone" />
      <Field label="Email" name="email" type="email" />
      <Field label="Base salary (PKR)" name="baseSalary" type="number" required />
      <Field label="Joined" name="joinedAt" type="date" />
      <div className="sm:col-span-2"><Submit label="Add employee" icon={<UserPlus />} /></div>
    </form>
  );
}

export function PayrollRunForm() {
  const [state, action] = useActionState<State, FormData>(runPayroll, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) { toast.success(state.message ?? "Done"); ref.current?.reset(); }
    else if (state?.error) toast.error(state.error);
  }, [state]);
  const thisMonth = new Date().toISOString().slice(0, 7);
  return (
    <form ref={ref} action={action} className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="period">Period</Label>
        <Input id="period" name="period" placeholder="2026-06" defaultValue={thisMonth} className="w-40 font-mono" />
      </div>
      <Submit label="Run payroll" icon={<Play />} />
    </form>
  );
}

export function AttendanceDatePicker({ date }: { date: string }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <Input
      type="date"
      defaultValue={date}
      onChange={(e) => {
        const sp = new URLSearchParams(params.toString());
        sp.set("tab", "attendance");
        sp.set("date", e.target.value);
        sp.delete("saved");
        router.push(`/admin/hr?${sp.toString()}`);
      }}
      className="w-44"
    />
  );
}

function Field({ label, name, type = "text", required, mono }: { label: string; name: string; type?: string; required?: boolean; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} className={mono ? "font-mono" : undefined} />
    </div>
  );
}
