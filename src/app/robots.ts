import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3020";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/pos", "/account", "/api", "/checkout"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
