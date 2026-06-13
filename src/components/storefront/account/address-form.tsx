"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { addAddress } from "@/app/(storefront)/account/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="self-start">
      {pending ? <Loader2 className="animate-spin" /> : <Plus />} Add address
    </Button>
  );
}

export function AddressForm() {
  const [state, action] = useActionState(addAddress, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "Saved");
      formRef.current?.reset();
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="label" label="Label (e.g. Home, Shop)" />
        <Field name="phone" label="Phone" placeholder="+92 3XX XXXXXXX" />
        <div className="sm:col-span-2"><Field name="line1" label="Address line 1" required /></div>
        <div className="sm:col-span-2"><Field name="line2" label="Address line 2 (optional)" /></div>
        <Field name="city" label="City" required />
        <Field name="province" label="Province" />
        <Field name="postalCode" label="Postal code" />
      </div>
      <SubmitButton />
    </form>
  );
}

function Field({ name, label, placeholder, required }: { name: string; label: string; placeholder?: string; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} placeholder={placeholder} required={required} />
    </div>
  );
}
