"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A–Z" },
];

export function SortSelect() {
  const router = useRouter();
  const params = useSearchParams();
  const current = params.get("sort") ?? "newest";

  function onChange(value: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set("sort", value);
    sp.delete("page");
    router.push(`/shop?${sp.toString()}`);
  }

  return (
    <Select value={current} onValueChange={onChange}>
      <SelectTrigger className="h-10 w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
