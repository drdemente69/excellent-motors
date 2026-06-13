import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Section({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("mx-auto max-w-7xl px-4 py-16 sm:px-6", className)}>
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel = "View all",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-muted-foreground">{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:gap-2.5 transition-all"
        >
          {hrefLabel} <ArrowRight className="size-4" />
        </Link>
      )}
    </div>
  );
}
