"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { RealtimeIndicator } from "@/components/admin/realtime-indicator";

export function PosHeaderActions({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2">
      <RealtimeIndicator />
      <ThemeToggle />
      <span className="hidden text-sm text-muted-foreground sm:inline">{name}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut({ callbackUrl: "/" })}
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut />
      </Button>
    </div>
  );
}
