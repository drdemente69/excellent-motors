import type { BadgeProps } from "@/components/ui/badge";

// Shared status → badge variant mapping for purchase orders.
export const PO_STATUS_VARIANT: Record<string, NonNullable<BadgeProps["variant"]>> = {
  draft: "secondary",
  sent: "default",
  partially_received: "warning",
  completed: "success",
  cancelled: "destructive",
};
