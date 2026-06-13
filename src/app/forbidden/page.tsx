import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Access denied" };

export default function ForbiddenPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-xl bg-destructive/15 text-destructive">
          <ShieldAlert className="size-7" />
        </span>
        <h1 className="mt-6 font-display text-2xl font-bold">Access denied</h1>
        <p className="mt-2 text-muted-foreground">
          You don&apos;t have permission to view this area. If you believe this is
          a mistake, contact an administrator.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild>
            <Link href="/">Back to store</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/account">My account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
