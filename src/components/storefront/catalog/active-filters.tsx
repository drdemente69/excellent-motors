"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

const LABELS: Record<string, string> = {
  q: "Search",
  category: "Category",
  brand: "Brand",
  make: "Make",
  model: "Model",
  year: "Year",
  minPrice: "Min",
  maxPrice: "Max",
};

export function ActiveFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const chips = Array.from(params.entries()).filter(
    ([k]) => k in LABELS && params.get(k),
  );
  if (chips.length === 0) return null;

  function remove(key: string) {
    const sp = new URLSearchParams(params.toString());
    sp.delete(key);
    sp.delete("page");
    router.push(`/shop?${sp.toString()}`);
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      {chips.map(([key, value]) => (
        <button
          key={key}
          onClick={() => remove(key)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs hover:border-primary/40"
        >
          <span className="text-muted-foreground">{LABELS[key]}:</span>
          <span className="font-medium">{value}</span>
          <X className="size-3" />
        </button>
      ))}
    </div>
  );
}
