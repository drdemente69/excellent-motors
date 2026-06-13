import Link from "next/link";
import { Gauge } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden px-4 py-10">
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>
      <div className="bg-grid absolute inset-0 opacity-50" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <span className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Gauge className="size-5" />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Excellent<span className="text-primary">Motors</span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
