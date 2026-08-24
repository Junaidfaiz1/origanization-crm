import { MarketingShell } from "@/components/marketing/shell";
import { ContactForm } from "@/components/marketing/contact-form";
import {
  SectionEyebrow,
  SectionHeading,
} from "@/components/marketing/primitives";
import { marketingMetadata } from "@/lib/marketing/seo";
import { MARKETING_ROUTES } from "@/lib/marketing/routes";

export const metadata = marketingMetadata({
  title: "Contact",
  description:
    "Talk with the Technova team about early access, product questions, or partnerships.",
  path: MARKETING_ROUTES.contact,
});

export default function ContactPage() {
  return (
    <MarketingShell>
      <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div>
            <SectionEyebrow>Contact</SectionEyebrow>
            <SectionHeading
              className="mt-4"
              title="Tell us what you’re"
              accent="trying to run."
              lead="Early access, product questions, partnerships — leave a note. We’ll reply from the team inbox when email is configured."
            />
            <div className="mt-10 space-y-4 text-sm text-[var(--mk-text-2)]">
              <p>Company sizes we typically hear from: 2–200 people.</p>
              <p>Common themes: bidding, delivery margin, client portals.</p>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#101010] p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
