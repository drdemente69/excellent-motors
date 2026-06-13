"use client";

import { useEffect, useRef, useState } from "react";
import {
  useInView,
  useMotionValue,
  animate,
  useReducedMotion,
} from "framer-motion";

export function StatCounter({
  value,
  suffix = "",
  prefix = "",
  label,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const mv = useMotionValue(0);
  const [display, setDisplay] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(mv, value, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, mv, reduced]);

  return (
    <div ref={ref} className="text-center">
      <div className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        {prefix}
        {display.toLocaleString("en-PK")}
        {suffix}
      </div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
