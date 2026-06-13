"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Search } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export type VehicleTaxonomy = {
  make: string;
  models: { model: string; years: number[] }[];
}[];

export function VehicleFinder({
  taxonomy,
  className,
}: {
  taxonomy: VehicleTaxonomy;
  className?: string;
}) {
  const router = useRouter();
  const [make, setMake] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [year, setYear] = useState<string>("");

  const models = useMemo(
    () => taxonomy.find((m) => m.make === make)?.models ?? [],
    [taxonomy, make],
  );
  const years = useMemo(
    () => models.find((m) => m.model === model)?.years ?? [],
    [models, model],
  );

  function find() {
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (year) params.set("year", year);
    router.push(`/shop?${params.toString()}`);
  }

  return (
    <div className={className}>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground/90">
        <Car className="size-4 text-primary" />
        Find parts for your vehicle
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
        <Select
          value={make}
          onValueChange={(v) => {
            setMake(v);
            setModel("");
            setYear("");
          }}
        >
          <SelectTrigger aria-label="Make">
            <SelectValue placeholder="Make" />
          </SelectTrigger>
          <SelectContent>
            {taxonomy.map((m) => (
              <SelectItem key={m.make} value={m.make}>
                {m.make}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={model}
          onValueChange={(v) => {
            setModel(v);
            setYear("");
          }}
          disabled={!make}
        >
          <SelectTrigger aria-label="Model">
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.model} value={m.model}>
                {m.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={year} onValueChange={setYear} disabled={!model}>
          <SelectTrigger aria-label="Year">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button onClick={find} disabled={!make} className="w-full">
          <Search /> Find parts
        </Button>
      </div>
    </div>
  );
}
