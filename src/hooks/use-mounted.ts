"use client";

import { useEffect, useState } from "react";

/** True after first client mount — guards against hydration mismatches for
 *  values that only exist on the client (cart, persisted state). */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
