"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { updateSettings } from "@/app/admin/settings/actions";
import type { BusinessSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = { ok?: boolean; error?: string; message?: string } | undefined;

function Submit() {
  const { pending } = useFormStatus();
  return <Button type="submit" disabled={pending}>{pending ? <Loader2 className="animate-spin" /> : <Save />} Save settings</Button>;
}

export function SettingsForm({ settings }: { settings: BusinessSettings }) {
  const [state, action] = useActionState<State, FormData>(updateSettings, undefined);
  useEffect(() => {
    if (state?.ok) toast.success(state.message ?? "Saved");
    else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-6">
      <Section title="Business">
        <Field label="Business name" name="businessName" defaultValue={settings.businessName} />
        <Field label="NTN / Tax ID" name="ntn" defaultValue={settings.ntn} />
        <div className="sm:col-span-2"><Field label="Address" name="address" defaultValue={settings.address} /></div>
        <Field label="Phone" name="phone" defaultValue={settings.phone} />
        <Field label="Email" name="email" type="email" defaultValue={settings.email} />
      </Section>
      <Section title="Commerce">
        <Field label="GST / tax rate (%)" name="taxRatePct" type="number" defaultValue={settings.taxRatePct} />
        <Field label="Currency" name="currency" defaultValue={settings.currency} />
        <Field label="Low-stock threshold" name="lowStockThreshold" type="number" defaultValue={settings.lowStockThreshold} />
      </Section>
      <Submit />
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 font-display font-semibold">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, name, defaultValue, type = "text" }: { label: string; name: string; defaultValue: string | number; type?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} defaultValue={defaultValue} />
    </div>
  );
}
