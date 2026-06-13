"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Option = { id: string; name: string };
type State = { error?: string } | undefined;
type Action = (prev: State, formData: FormData) => Promise<State>;

export type ProductDefaults = Partial<{
  id: string;
  name: string;
  sku: string;
  barcode: string;
  partNumber: string;
  oemNumber: string;
  categoryId: string;
  brandId: string;
  price: number;
  cost: number;
  taxRatePct: number;
  status: string;
  isFeatured: boolean;
  shortDesc: string;
  description: string;
  imageUrl: string;
  reorderLevel: number;
}>;

function SaveButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? <Loader2 className="animate-spin" /> : <Save />} {label}
    </Button>
  );
}

export function ProductForm({
  action,
  categories,
  brands,
  defaults = {},
  mode,
}: {
  action: Action;
  categories: Option[];
  brands: Option[];
  defaults?: ProductDefaults;
  mode: "create" | "edit";
}) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      {state?.error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Section title="Basics">
        <div className="sm:col-span-2">
          <Field label="Product name" name="name" defaultValue={defaults.name} required />
        </div>
        <Field label="SKU" name="sku" defaultValue={defaults.sku} required mono />
        <Field label="Barcode" name="barcode" defaultValue={defaults.barcode} mono />
        <Field label="Part number" name="partNumber" defaultValue={defaults.partNumber} mono />
        <Field label="OEM number" name="oemNumber" defaultValue={defaults.oemNumber} mono />
        <SelectField label="Category" name="categoryId" defaultValue={defaults.categoryId} options={categories} required />
        <SelectField label="Brand" name="brandId" defaultValue={defaults.brandId} options={[{ id: "", name: "— None —" }, ...brands]} />
      </Section>

      <Section title="Pricing & tax">
        <Field label="Sell price (PKR)" name="price" type="number" step="0.01" defaultValue={defaults.price} required />
        <Field label="Cost (PKR)" name="cost" type="number" step="0.01" defaultValue={defaults.cost ?? 0} />
        <Field label="GST %" name="taxRatePct" type="number" step="0.01" defaultValue={defaults.taxRatePct ?? 17} />
      </Section>

      <Section title="Inventory">
        <Field label="Reorder level" name="reorderLevel" type="number" defaultValue={defaults.reorderLevel ?? 5} />
        {mode === "create" && (
          <Field label="Opening stock" name="initialStock" type="number" defaultValue={0} />
        )}
        <SelectField
          label="Status"
          name="status"
          defaultValue={defaults.status ?? "active"}
          options={[
            { id: "active", name: "Active" },
            { id: "draft", name: "Draft" },
            { id: "archived", name: "Archived" },
          ]}
        />
        <label className="flex items-center gap-2 self-end pb-2.5 text-sm">
          <input type="checkbox" name="isFeatured" defaultChecked={defaults.isFeatured} className="size-4 accent-[var(--primary)]" />
          Featured on storefront
        </label>
      </Section>

      <Section title="Content">
        <div className="sm:col-span-2">
          <Field label="Short description" name="shortDesc" defaultValue={defaults.shortDesc} />
        </div>
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <Label htmlFor="description">Full description</Label>
          <Textarea id="description" name="description" defaultValue={defaults.description} rows={4} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Image URL (e.g. /placeholders/brakes.svg)" name="imageUrl" defaultValue={defaults.imageUrl} mono />
        </div>
      </Section>

      <div className="flex gap-3">
        <SaveButton label={mode === "create" ? "Create product" : "Save changes"} />
        <Button asChild variant="outline" size="lg">
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
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

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  step,
  mono,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  step?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} step={step} required={required} defaultValue={defaultValue} className={cn(mono && "font-mono")} />
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  options: Option[];
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="h-11 rounded-lg border border-input bg-surface px-3.5 text-sm focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}
