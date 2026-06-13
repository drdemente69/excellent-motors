"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CarFront,
  Wind,
  CircleDot,
  Armchair,
  MonitorSmartphone,
  Volume2,
  Lightbulb,
  Sparkles,
  Package,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  "body-kits": CarFront,
  aero: Wind,
  wheels: CircleDot,
  seats: Armchair,
  infotainment: MonitorSmartphone,
  audio: Volume2,
  lighting: Lightbulb,
  styling: Sparkles,
};

export type CategoryItem = {
  slug: string;
  name: string;
  count: number;
  description: string | null;
};

export function CategoryGrid({ categories }: { categories: CategoryItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {categories.map((c, i) => {
        const Icon = ICONS[c.slug] ?? Package;
        return (
          <motion.div
            key={c.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.4, delay: Math.min(i * 0.05, 0.3) }}
          >
            <Link
              href={`/shop?category=${c.slug}`}
              className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/50 hover:bg-surface-2"
            >
              <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-display font-semibold tracking-tight">
                  {c.name}
                </h3>
                <p className="text-xs text-muted-foreground">{c.count} products</p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
