"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function AdminSearch({ base, placeholder }: { base: string; placeholder?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const sp = new URLSearchParams(params.toString());
        if (q) sp.set("q", q);
        else sp.delete("q");
        router.push(`${base}?${sp.toString()}`);
      }}
      className="relative w-full max-w-xs"
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} className="h-10 pl-9" />
    </form>
  );
}
