// Strings layer — a thin seam so copy is centralised and Urdu (ur) can be added
// later without hunting hardcoded text across components. Default locale: en-PK.

export type Locale = "en" | "ur";

const en = {
  "brand.name": "Excellent Motors",
  "brand.tagline": "Engineered Parts. Effortless Service.",
  "nav.home": "Home",
  "nav.shop": "Shop",
  "nav.catalogue": "Catalogue",
  "nav.about": "About",
  "nav.contact": "Contact",
  "nav.account": "Account",
  "nav.cart": "Cart",
  "cta.shopNow": "Shop Parts",
  "cta.findParts": "Find parts for your vehicle",
  "cta.addToCart": "Add to cart",
  "cta.viewDetails": "View details",
  "stock.inStock": "In stock",
  "stock.low": "Low stock",
  "stock.out": "Out of stock",
  "product.partNumber": "Part #",
  "product.oem": "OEM #",
  "product.brand": "Brand",
  "product.compatibility": "Compatible vehicles",
  "fitment.make": "Make",
  "fitment.model": "Model",
  "fitment.year": "Year",
  "footer.rights": "All rights reserved.",
} as const;

export type StringKey = keyof typeof en;

const dictionaries: Record<Locale, Partial<Record<StringKey, string>>> = {
  en,
  ur: {}, // future Urdu translations slot in here
};

export function t(key: StringKey, locale: Locale = "en"): string {
  return dictionaries[locale][key] ?? en[key] ?? key;
}
