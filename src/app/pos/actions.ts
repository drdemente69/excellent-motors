"use server";

import { requireRole } from "@/lib/auth-helpers";
import {
  completeSale,
  holdSale,
  discardHeldSale,
  type SaleLineInput,
  type PaymentInput,
} from "@/lib/pos/service";
import { InsufficientStockError } from "@/lib/inventory/errors";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export async function completeSaleAction(input: {
  items: SaleLineInput[];
  payments: PaymentInput[];
  orderDiscount?: number;
  customerName?: string;
  customerPhone?: string;
}): Promise<Result<Awaited<ReturnType<typeof completeSale>>>> {
  const user = await requireRole("cashier", "admin");
  try {
    const data = await completeSale({ ...input, cashierId: user.id });
    return { ok: true, data };
  } catch (err) {
    if (err instanceof InsufficientStockError) {
      return { ok: false, error: "Not enough stock for one or more items." };
    }
    return { ok: false, error: err instanceof Error ? err.message : "Sale failed" };
  }
}

export async function holdSaleAction(input: {
  items: SaleLineInput[];
  label: string;
  customerName?: string;
}): Promise<Result<{ id: string; label: string }>> {
  const user = await requireRole("cashier", "admin");
  try {
    const data = await holdSale({ ...input, cashierId: user.id });
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not hold sale" };
  }
}

export async function discardHeldAction(id: string): Promise<void> {
  await requireRole("cashier", "admin");
  await discardHeldSale(id);
}
