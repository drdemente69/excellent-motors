import { Phone, Mail, MapPin, Clock, MessageCircle, Globe } from "lucide-react";
import { getSettings } from "@/lib/settings";
import { ContactForm } from "@/components/storefront/contact-form";

export const metadata = {
  title: "Contact",
  description: "Get in touch with Excellent Motors — visit our store, call, or send us a message.",
};

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <header className="mb-10 max-w-2xl">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Get in touch
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          We&apos;re here to help you find the right part.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Questions about fitment, availability or an order? Reach out and our
          team will get back to you.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Form */}
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h2 className="mb-5 font-display text-lg font-semibold">Send us a message</h2>
          <ContactForm />
        </div>

        {/* Info + map */}
        <aside className="flex flex-col gap-4">
          <InfoRow icon={<MapPin className="size-5" />} title="Visit us">
            {settings.address}
          </InfoRow>
          <InfoRow icon={<Phone className="size-5" />} title="Call us">
            <a href={`tel:${settings.phone}`} className="hover:text-primary">{settings.phone}</a>
          </InfoRow>
          <InfoRow icon={<Mail className="size-5" />} title="Email">
            <a href={`mailto:${settings.email}`} className="hover:text-primary">{settings.email}</a>
          </InfoRow>
          <InfoRow icon={<Clock className="size-5" />} title="Hours">
            Mon–Sat · 10:00 AM – 8:00 PM
          </InfoRow>

          <div className="flex gap-2">
            <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" className="grid size-10 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary" aria-label="WhatsApp">
              <MessageCircle className="size-5" />
            </a>
            <a href="#" className="grid size-10 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary" aria-label="Website">
              <Globe className="size-5" />
            </a>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border">
            <iframe
              title="Excellent Motors location"
              className="h-64 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              src="https://www.openstreetmap.org/export/embed.html?bbox=74.30%2C31.55%2C74.36%2C31.59&layer=mapnik&marker=31.57%2C74.33"
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

function InfoRow({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="mt-0.5 text-sm text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
