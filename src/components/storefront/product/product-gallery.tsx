"use client";

import { useState } from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { Box, ImageIcon, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

const ProductViewer3D = dynamic(
  () => import("@/components/three/product-viewer-3d"),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full place-items-center text-sm text-muted-foreground">
        Loading 3D viewer…
      </div>
    ),
  },
);

export function ProductGallery({
  images,
  categorySlug,
  model3dUrl,
  name,
}: {
  images: { url: string; alt: string | null }[];
  categorySlug: string;
  model3dUrl: string | null;
  name: string;
}) {
  // 3D viewer only when the product actually has a model; otherwise photos.
  const has3D = Boolean(model3dUrl);
  void categorySlug;
  const [mode, setMode] = useState<"3d" | "photos">(has3D ? "3d" : "photos");
  const [active, setActive] = useState(0);

  const gallery = images.length > 0 ? images : [{ url: "/placeholders/accessories.svg", alt: name }];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-background grain">
        <div className="bg-grid absolute inset-0 opacity-40" />
        {mode === "3d" ? (
          <div className="absolute inset-0">
            <ProductViewer3D modelUrl={model3dUrl} />
            <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur">
              <RotateCcw className="size-3" /> Drag to rotate
            </div>
          </div>
        ) : (
          <Image
            src={gallery[active].url}
            alt={gallery[active].alt ?? name}
            fill
            priority
            className="object-contain p-6"
          />
        )}

        {has3D && (
          <div className="absolute right-3 top-3 flex gap-1 rounded-lg border border-border bg-black/40 p-1 backdrop-blur">
            <button
              onClick={() => setMode("3d")}
              className={cn(
                "grid size-8 place-items-center rounded-md transition-colors",
                mode === "3d" ? "bg-primary text-primary-foreground" : "text-white/80 hover:bg-white/10",
              )}
              aria-label="3D view"
            >
              <Box className="size-4" />
            </button>
            <button
              onClick={() => setMode("photos")}
              className={cn(
                "grid size-8 place-items-center rounded-md transition-colors",
                mode === "photos" ? "bg-primary text-primary-foreground" : "text-white/80 hover:bg-white/10",
              )}
              aria-label="Photos"
            >
              <ImageIcon className="size-4" />
            </button>
          </div>
        )}
      </div>

      {mode === "photos" && gallery.length > 1 && (
        <div className="flex gap-2">
          {gallery.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={cn(
                "relative size-20 overflow-hidden rounded-lg border bg-surface-2",
                i === active ? "border-primary" : "border-border",
              )}
            >
              <Image src={img.url} alt={img.alt ?? name} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
