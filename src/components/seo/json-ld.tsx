// Renders structured data per the Next.js JSON-LD guide. The `<` escape guards
// against XSS when product/category text is interpolated.
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
