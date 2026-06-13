"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type State = { error?: string } | undefined;
type Action = (prev: State, formData: FormData) => Promise<State>;

export type VendorDefaults = Partial<{
  id: string;
  name: string;
  code: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  notes: string;
}>;

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Save />} {label}
    </Button>
  );
}

export function VendorForm({
  action,
  defaults = {},
  mode,
}: {
  action: Action;
  defaults?: VendorDefaults;
  mode: "create" | "edit";
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      {state?.error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">{state.error}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Vendor name" name="name" defaultValue={defaults.name} required />
        {mode === "create" && <Field label="Code (auto if blank)" name="code" defaultValue={defaults.code} mono />}
        <Field label="Contact person" name="contactName" defaultValue={defaults.contactName} />
        <Field label="Phone" name="phone" defaultValue={defaults.phone} />
        <Field label="Email" name="email" type="email" defaultValue={defaults.email} />
        <Field label="Tax ID / NTN" name="taxId" defaultValue={defaults.taxId} />
        <div className="sm:col-span-2">
          <Field label="Address" name="address" defaultValue={defaults.address} />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" name="notes" defaultValue={defaults.notes} rows={3} />
        </div>
      </div>
      <SaveButton label={mode === "create" ? "Add vendor" : "Save changes"} />
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  mono,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  type?: string;
  required?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} defaultValue={defaultValue} className={mono ? "font-mono" : undefined} />
    </div>
  );
}
