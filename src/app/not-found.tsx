import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-xl bg-primary/15 text-primary">
          <Compass className="size-7" />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold">404 — Lost a part?</h1>
        <p className="mt-2 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button asChild><Link href="/">Back home</Link></Button>
          <Button asChild variant="outline"><Link href="/shop">Browse parts</Link></Button>
        </div>
      </div>
    </div>
  );
}
