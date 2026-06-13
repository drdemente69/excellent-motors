// Pakistan-locale formatting helpers. Currency is PKR throughout.
import { format as formatDate } from "date-fns";

const PKR = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  maximumFractionDigits: 0,
});

const PKR2 = new Intl.NumberFormat("en-PK", {
  style: "currency",
  currency: "PKR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

type Money = number | string | { toString(): string };

function toNumber(value: Money): number {
  if (typeof value === "number") return value;
  return Number(value.toString());
}

/** Rs 12,500 — whole rupees, for storefront display. */
export function formatPKR(value: Money): string {
  return PKR.format(toNumber(value)).replace("PKR", "Rs");
}

/** Rs 12,500.00 — for invoices and accounting. */
export function formatPKR2(value: Money): string {
  return PKR2.format(toNumber(value)).replace("PKR", "Rs");
}

/** Normalise a Pakistani phone number towards +92 format. */
export function formatPhonePK(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("92")) return `+${digits}`;
  if (digits.startsWith("0")) return `+92${digits.slice(1)}`;
  if (digits.length === 10) return `+92${digits}`;
  return input.startsWith("+") ? input : `+92${digits}`;
}

export function formatDateShort(date: Date | string): string {
  return formatDate(new Date(date), "dd MMM yyyy");
}

export function formatDateTime(date: Date | string): string {
  return formatDate(new Date(date), "dd MMM yyyy, h:mm a");
}

/** Compact number for stat counters, e.g. 12500 -> 12.5K. */
export function formatCompact(value: number): string {
  return new Intl.NumberFormat("en-PK", { notation: "compact" }).format(value);
}
