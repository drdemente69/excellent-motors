// Shared constants: roles, route groups, and storefront navigation.
import type { Role } from "@prisma/client";

export const ROLES: Role[] = [
  "customer",
  "cashier",
  "inventory_manager",
  "accountant",
  "hr",
  "admin",
];

/** Roles allowed into the back-office (POS/ERP). Customers are storefront-only. */
export const STAFF_ROLES: Role[] = [
  "cashier",
  "inventory_manager",
  "accountant",
  "hr",
  "admin",
];

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Customer",
  cashier: "Cashier",
  inventory_manager: "Inventory Manager",
  accountant: "Accountant",
  hr: "HR",
  admin: "Administrator",
};

/** Where each role lands after login. */
export const ROLE_HOME: Record<Role, string> = {
  customer: "/account",
  cashier: "/pos",
  inventory_manager: "/admin/products",
  accountant: "/admin",
  hr: "/admin",
  admin: "/admin",
};

export const STOREFRONT_NAV = [
  { href: "/", labelKey: "nav.home" as const },
  { href: "/shop", labelKey: "nav.shop" as const },
  { href: "/about", labelKey: "nav.about" as const },
  { href: "/contact", labelKey: "nav.contact" as const },
];

export const LOW_STOCK_DEFAULT = 5;
export const DEFAULT_TAX_RATE = 17; // GST %, overridable in Settings
