"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { createExpense } from "@/app/admin/accounts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = ["Rent", "Utilities", "Salaries", "Marketing", "Transport", "Supplies", "Maintenance", "Misc"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <Plus />} Add expense
    </Button>
  );
}

export function ExpenseForm() {
  const [state, action] = useActionState(createExpense, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "Saved");
      formRef.current?.reset();
    } else if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="category">Category</Label>
        <Input id="category" name="category" list="expense-cats" placeholder="Rent, Utilities…" required />
        <datalist id="expense-cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="amount">Amount (PKR)</Label>
        <Input id="amount" name="amount" type="number" step="0.01" min="0" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="date">Date</Label>
        <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="description">Description</Label>
        <Input id="description" name="description" placeholder="Optional" />
      </div>
      <div className="sm:col-span-2 lg:col-span-4">
        <SubmitButton />
      </div>
    </form>
  );
}
