"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Pagination({ page, pages }: { page: number; pages: number }) {
  const router = useRouter();
  const params = useSearchParams();
  if (pages <= 1) return null;

  function go(p: number) {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(p));
    router.push(`/shop?${sp.toString()}`);
  }

  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(
    (n) => n === 1 || n === pages || Math.abs(n - page) <= 1,
  );

  return (
    <div className="mt-10 flex items-center justify-center gap-2">
      <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => go(page - 1)}>
        <ChevronLeft />
      </Button>
      {nums.map((n, i) => {
        const gap = i > 0 && n - nums[i - 1] > 1;
        return (
          <span key={n} className="flex items-center gap-2">
            {gap && <span className="text-muted-foreground">…</span>}
            <Button
              variant={n === page ? "default" : "outline"}
              size="icon"
              onClick={() => go(n)}
            >
              {n}
            </Button>
          </span>
        );
      })}
      <Button variant="outline" size="icon" disabled={page >= pages} onClick={() => go(page + 1)}>
        <ChevronRight />
      </Button>
    </div>
  );
}
