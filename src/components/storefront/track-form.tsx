"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function TrackForm({ initial = "" }: { initial?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) router.push(`/track?order=${encodeURIComponent(value.trim())}`);
      }}
      className="flex gap-2"
    >
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="e.g. EM-2026-AB12CD"
        className="font-mono"
        aria-label="Order number"
      />
      <Button type="submit">
        <Search /> Track
      </Button>
    </form>
  );
}
