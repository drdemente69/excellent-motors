"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { formatDateTime } from "@/lib/format";

type Notif = { id: string; title: string; body: string; link: string | null; read: boolean; createdAt: string };

export function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/notifications");
      if (!r.ok) return;
      const d = await r.json();
      setItems(d.items);
      setUnread(d.unread);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000);
    return () => clearInterval(t);
  }, [load]);

  async function onOpenChange(open: boolean) {
    if (open && unread > 0) {
      try {
        await fetch("/api/notifications", { method: "POST" });
      } catch {
        /* ignore */
      }
      setUnread(0);
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell />
          {unread > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="border-b border-border px-4 py-2.5 text-sm font-medium">Notifications</div>
        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p>
          ) : (
            items.map((n) => {
              const inner = (
                <>
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />}
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </div>
                </>
              );
              return n.link ? (
                <Link key={n.id} href={n.link} className="block border-b border-border px-4 py-3 last:border-0 hover:bg-surface-2">{inner}</Link>
              ) : (
                <div key={n.id} className="border-b border-border px-4 py-3 last:border-0">{inner}</div>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
