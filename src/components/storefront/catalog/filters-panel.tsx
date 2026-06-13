"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Option = { slug: string; name: string; count?: number };

export function FiltersPanel({
  categories,
  brands,
  onNavigate,
}: {
  categories: Option[];
  brands: Option[];
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const params = useSearchParams();

  const currentCategory = params.get("category") ?? "";
  const currentBrand = params.get("brand") ?? "";
  const [minPrice, setMinPrice] = useState(params.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(params.get("maxPrice") ?? "");

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === "") sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete("page"); // reset pagination on filter change
    router.push(`/shop?${sp.toString()}`);
    onNavigate?.();
  }

  return (
    <div className="flex flex-col gap-7">
      <FilterGroup title="Category">
        <FilterItem
          active={currentCategory === ""}
          label="All categories"
          onClick={() => update({ category: null })}
        />
        {categories.map((c) => (
          <FilterItem
            key={c.slug}
            active={currentCategory === c.slug}
            label={c.name}
            count={c.count}
            onClick={() => update({ category: c.slug })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Brand">
        <FilterItem
          active={currentBrand === ""}
          label="All brands"
          onClick={() => update({ brand: null })}
        />
        {brands.map((b) => (
          <FilterItem
            key={b.slug}
            active={currentBrand === b.slug}
            label={b.name}
            onClick={() => update({ brand: b.slug })}
          />
        ))}
      </FilterGroup>

      <FilterGroup title="Price (PKR)">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="h-9"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="h-9"
          />
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="mt-2 w-full"
          onClick={() => update({ minPrice: minPrice || null, maxPrice: maxPrice || null })}
        >
          Apply price
        </Button>
      </FilterGroup>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setMinPrice("");
          setMaxPrice("");
          router.push("/shop");
          onNavigate?.();
        }}
        className="justify-start text-muted-foreground"
      >
        <X className="size-4" /> Clear all filters
      </Button>
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </Label>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function FilterItem({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
        active ? "bg-primary/10 font-medium text-primary" : "text-foreground/80 hover:bg-surface-2",
      )}
    >
      <span>{label}</span>
      {count != null && <span className="text-xs text-muted-foreground">{count}</span>}
    </button>
  );
}
