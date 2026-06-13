import { prisma } from "@/lib/db";
import { DEFAULT_TAX_RATE, LOW_STOCK_DEFAULT } from "@/lib/constants";

// Typed accessor over the Setting key/value table. Values are JSON-encoded.

export type BusinessSettings = {
  businessName: string;
  taxRatePct: number;
  currency: string;
  lowStockThreshold: number;
  address: string;
  phone: string;
  email: string;
  ntn: string; // tax id
};

const DEFAULTS: BusinessSettings = {
  businessName: "Excellent Motors",
  taxRatePct: DEFAULT_TAX_RATE,
  currency: "PKR",
  lowStockThreshold: LOW_STOCK_DEFAULT,
  address: "Auto Market, Lahore, Pakistan",
  phone: "+92 300 1234567",
  email: "info@excellentmotors.pk",
  ntn: "0000000-0",
};

export async function getSetting<K extends keyof BusinessSettings>(
  key: K,
): Promise<BusinessSettings[K]> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) return DEFAULTS[key];
  try {
    return JSON.parse(row.value) as BusinessSettings[K];
  } catch {
    return DEFAULTS[key];
  }
}

export async function getSettings(): Promise<BusinessSettings> {
  const rows = await prisma.setting.findMany();
  const map = new Map(rows.map((r) => [r.key, r.value]));
  const result = { ...DEFAULTS };
  for (const key of Object.keys(DEFAULTS) as (keyof BusinessSettings)[]) {
    const raw = map.get(key);
    if (raw !== undefined) {
      try {
        // @ts-expect-error narrowed by key at runtime
        result[key] = JSON.parse(raw);
      } catch {
        /* keep default */
      }
    }
  }
  return result;
}

export async function setSetting<K extends keyof BusinessSettings>(
  key: K,
  value: BusinessSettings[K],
): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(value) },
    update: { value: JSON.stringify(value) },
  });
}
