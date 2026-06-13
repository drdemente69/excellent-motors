"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, ShieldCheck, Wrench, Boxes } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VehicleFinder, type VehicleTaxonomy } from "@/components/storefront/vehicle-finder";
import { cn } from "@/lib/utils";

const CarHeroScene = dynamic(() => import("@/components/three/car-hero-scene"), { ssr: false });

const PHASES = ["Side profile", "Top-down", "Exploded view"];

export function CarHero({ taxonomy }: { taxonomy: VehicleTaxonomy }) {
  const [enableScroll, setEnableScroll] = useState(false);
  const [phase, setPhase] = useState(0);

  const progressRef = useRef(0);
  const sectionRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = window.matchMedia("(min-width: 768px)").matches;
    setEnableScroll(wide && !reduced);
  }, []);

  useEffect(() => {
    if (!enableScroll) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const prog = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0;
      progressRef.current = prog;
      if (overlayRef.current) overlayRef.current.style.opacity = String(Math.max(0, 1 - prog / 0.22));
      if (hintRef.current) hintRef.current.style.opacity = String(Math.max(0, 1 - prog / 0.1));
      const ph = prog < 0.42 ? 0 : prog < 0.6 ? 1 : 2;
      if (ph !== phaseRef.current) {
        phaseRef.current = ph;
        setPhase(ph);
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [enableScroll]);

  const headline = (
    <>
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
        <span className="size-1.5 rounded-full bg-success" />
        Body kits · Wheels · Audio · Lighting
      </span>
      <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
        Build it
        <br />
        <span className="text-gradient">your way.</span>
      </h1>
      <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
        Premium car-modification parts — wide-body kits, forged wheels, bucket
        seats, infotainment and sound — fitted by the experts at Excellent Motors.
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Button asChild size="lg"><Link href="/shop">Shop parts <ArrowRight /></Link></Button>
        <Button asChild size="lg" variant="outline"><Link href="/about">Why Excellent Motors</Link></Button>
      </div>
      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><Wrench className="size-4 text-primary" /> Pro fitment</span>
        <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-primary" /> Warranty-backed</span>
        <span className="inline-flex items-center gap-2"><Boxes className="size-4 text-primary" /> 5,000+ SKUs</span>
      </div>
    </>
  );

  // ── Compact hero (mobile / reduced-motion) ─────────────────────────────────
  if (!enableScroll) {
    return (
      <section className="relative overflow-hidden grain">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            {headline}
          </motion.div>
          <div className="glass mt-10 rounded-2xl p-5 shadow-2xl">
            <VehicleFinder taxonomy={taxonomy} />
          </div>
        </div>
      </section>
    );
  }

  // ── Pinned scroll experience ───────────────────────────────────────────────
  return (
    <>
      <section ref={sectionRef} className="relative" style={{ height: "230vh" }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <div className="bg-grid absolute inset-0 opacity-50" />
          <div className="pointer-events-none absolute -top-40 left-1/2 h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-primary/15 blur-[130px]" />

          {/* 3D layer */}
          <div className="absolute inset-0">
            <CarHeroScene progressRef={progressRef} />
          </div>

          {/* Phase 1 headline overlay */}
          <div ref={overlayRef} className="pointer-events-none absolute inset-0">
            <div className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6">
              <div className="pointer-events-auto max-w-xl">{headline}</div>
            </div>
          </div>

          {/* Phase indicator */}
          <div className="absolute left-1/2 top-6 -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-full border border-border bg-surface/70 px-3 py-1.5 text-xs backdrop-blur">
              {PHASES.map((label, i) => (
                <span key={label} className={cn("flex items-center gap-1.5", i === phase ? "text-primary" : "text-muted-foreground")}>
                  <span className={cn("size-1.5 rounded-full", i === phase ? "bg-primary" : "bg-border")} />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Scroll hint */}
          <div ref={hintRef} className="absolute bottom-6 left-1/2 -translate-x-1/2">
            <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
              Scroll to dismantle
              <ChevronDown className="size-4 animate-bounce" />
            </div>
          </div>
        </div>
      </section>

      {/* Vehicle finder — first content after the hero */}
      <div className="relative z-10 mx-auto -mt-8 mb-4 max-w-5xl px-4 sm:px-6">
        <div className="glass rounded-2xl p-5 shadow-2xl">
          <VehicleFinder taxonomy={taxonomy} />
        </div>
      </div>
    </>
  );
}
