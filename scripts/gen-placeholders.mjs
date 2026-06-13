// Generates branded SVG placeholder images per product category into
// /public/placeholders. Engineered dark look so the catalogue is consistent
// without external image assets.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "placeholders");
mkdirSync(outDir, { recursive: true });

const ORANGE = "#ff6b1a";
const CYAN = "#2fd9ff";

const categories = {
  "body-kits": "BODY KITS",
  aero: "SPOILERS & AERO",
  wheels: "WHEELS & SUSPENSION",
  seats: "SEATS & INTERIOR",
  infotainment: "INFOTAINMENT",
  audio: "SOUND SYSTEMS",
  lighting: "LIGHTING",
  styling: "STYLING",
};

function svg(label, accent) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
  <defs>
    <radialGradient id="g" cx="50%" cy="38%" r="70%">
      <stop offset="0%" stop-color="#11161e"/>
      <stop offset="100%" stop-color="#07090d"/>
    </radialGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="100%" stop-color="${CYAN}"/>
    </linearGradient>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M40 0H0V40" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="800" height="600" fill="url(#g)"/>
  <rect width="800" height="600" fill="url(#grid)"/>
  <g transform="translate(400 270)">
    <circle r="150" fill="none" stroke="url(#ring)" stroke-width="2" opacity="0.55"/>
    <circle r="110" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="14" stroke-dasharray="6 10"/>
    <circle r="60" fill="none" stroke="${accent}" stroke-width="3" opacity="0.8"/>
    <circle r="14" fill="${accent}" opacity="0.9"/>
    ${Array.from({ length: 6 })
      .map((_, i) => {
        const a = (i * Math.PI) / 3;
        const x = Math.cos(a) * 60;
        const y = Math.sin(a) * 60;
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="7" fill="#0b0e13" stroke="${accent}" stroke-width="2"/>`;
      })
      .join("")}
  </g>
  <text x="400" y="500" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="34" letter-spacing="6" fill="#e8edf4" font-weight="700">${label}</text>
  <text x="400" y="540" text-anchor="middle" font-family="'Space Grotesk',sans-serif" font-size="16" letter-spacing="4" fill="${accent}">EXCELLENT MOTORS</text>
</svg>`;
}

for (const [slug, label] of Object.entries(categories)) {
  writeFileSync(join(outDir, `${slug}.svg`), svg(label, ORANGE));
}

// A hero poster fallback (used if 3D fails / reduced motion)
writeFileSync(
  join(outDir, "hero-fallback.svg"),
  svg("PERFORMANCE PARTS", ORANGE).replace('width="800" height="600"', 'width="1200" height="800"').replace('viewBox="0 0 800 600"', 'viewBox="0 0 800 600"'),
);

console.log(`Generated ${Object.keys(categories).length + 1} placeholder SVGs in public/placeholders`);
