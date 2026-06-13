"use client";

import { Badge } from "@/components/ui/badge";
import { useLiveStock } from "@/hooks/use-live-stock";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export function StockBadge({
  productId,
  initial,
  lowThreshold = 5,
  showCount = false,
}: {
  productId: string;
  initial: number;
  lowThreshold?: number;
  showCount?: boolean;
}) {
  const available = useLiveStock(productId, initial);

  if (available <= 0) {
    return (
      <Badge variant="destructive">
        <XCircle className="size-3" /> Out of stock
      </Badge>
    );
  }
  if (available <= lowThreshold) {
    return (
      <Badge variant="warning">
        <AlertTriangle className="size-3" /> Low stock
        {showCount ? ` · ${available}` : ""}
      </Badge>
    );
  }
  return (
    <Badge variant="success">
      <CheckCircle2 className="size-3" /> In stock
      {showCount ? ` · ${available}` : ""}
    </Badge>
  );
}
