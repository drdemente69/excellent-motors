import { Target, Eye, Gauge, ShieldCheck, Users, Wrench } from "lucide-react";
import { Section, SectionHeading } from "@/components/storefront/section";
import { StatCounter } from "@/components/storefront/stat-counter";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";

export const metadata = {
  title: "About us",
  description:
    "Excellent Motors — a Pakistan-based car parts business pairing a modern online storefront with a real-time in-store POS and inventory system.",
};

export default async function AboutPage() {
  const [settings, productCount, vehicleCount] = await Promise.all([
    getSettings(),
    prisma.product.count(),
    prisma.vehicle.count(),
  ]);

  return (
    <>
      {/* Intro */}
      <section className="relative overflow-hidden border-b border-border grain">
        <div className="bg-grid absolute inset-0 opacity-50" />
        <div className="pointer-events-none absolute -top-32 right-0 h-[420px] w-[520px] rounded-full bg-primary/15 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            About Excellent Motors
          </span>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            The parts you trust, the service you remember.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
            Excellent Motors is a Pakistan-based automotive parts business built
            on a simple idea: pair a beautiful, modern online store with a fast,
            reliable in-store system — sharing one live inventory so customers
            always see real availability.
          </p>
        </div>
      </section>

      {/* Stats */}
      <Section>
        <div className="grid grid-cols-2 gap-8 rounded-2xl border border-border bg-card p-8 sm:grid-cols-4">
          <StatCounter value={productCount} suffix="+" label="Parts catalogued" />
          <StatCounter value={vehicleCount} suffix="+" label="Vehicles supported" />
          <StatCounter value={15} suffix="+" label="Years in trade" />
          <StatCounter value={98} suffix="%" label="On-time dispatch" />
        </div>
      </Section>

      {/* Vision & Mission */}
      <Section className="pt-0">
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <span className="grid size-11 place-items-center rounded-lg bg-primary/10 text-primary">
              <Eye className="size-5" />
            </span>
            <h3 className="mt-5 font-display text-xl font-bold">Our vision</h3>
            <p className="mt-3 text-muted-foreground">
              To be Pakistan&apos;s most trusted destination for car parts — where
              quality, honest pricing and genuine fitment advice come standard,
              online and in-store.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <span className="grid size-11 place-items-center rounded-lg bg-accent/10 text-accent">
              <Target className="size-5" />
            </span>
            <h3 className="mt-5 font-display text-xl font-bold">Our mission</h3>
            <p className="mt-3 text-muted-foreground">
              Make finding and buying the right part effortless — backed by
              real-time stock, warranty-grade components and a team that knows
              vehicles inside out.
            </p>
          </div>
        </div>
      </Section>

      {/* Why trust us */}
      <Section className="pt-0">
        <SectionHeading
          eyebrow="Why us"
          title="Built on trust and engineering"
          description="Every part and every order is handled with the same care."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Genuine & warranty-backed", desc: "Sourced from established manufacturers with traceable part numbers." },
            { icon: Gauge, title: "Live, accurate stock", desc: "One shared inventory means the number you see is the number we have." },
            { icon: Wrench, title: "Fitment expertise", desc: "Search by make, model and year — or ask us, we know the fit." },
            { icon: Users, title: "Trade & retail", desc: "Workshops and individual owners both get the same quality and service." },
            { icon: Target, title: "Fair pricing", desc: "Transparent PKR pricing with GST shown clearly at checkout." },
            { icon: Eye, title: "Order visibility", desc: "Track every order from placed to delivered, with notifications." },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <f.icon className="size-6 text-primary" />
              <h4 className="mt-4 font-display font-semibold">{f.title}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Contact strip */}
      <Section className="pt-0">
        <div className="rounded-2xl border border-border bg-gradient-to-br from-surface to-background p-8 text-center sm:p-12">
          <h3 className="font-display text-2xl font-bold">Visit our store</h3>
          <p className="mt-2 text-muted-foreground">{settings.address}</p>
          <p className="mt-1 text-muted-foreground">
            {settings.phone} · {settings.email}
          </p>
        </div>
      </Section>
    </>
  );
}
