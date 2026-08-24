"use client";

import { useState, type FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MagneticButton } from "@/components/marketing/primitives";

const SIZES = ["1–5", "6–20", "21–50", "51–200", "200+"] as const;

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-[var(--mk-bronze)]/30 bg-[var(--mk-bronze)]/10 p-6">
        <p className="text-sm font-medium text-[var(--mk-warm)]">
          Thanks for reaching out
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[var(--mk-text-2)]">
          This form is a UI preview until contact delivery is configured. Email
          us directly if you need a reply soon.
        </p>
        <button
          type="button"
          className="mt-4 text-sm text-[var(--mk-text)] underline-offset-4 hover:underline"
          onClick={() => setSubmitted(false)}
        >
          Send another message
        </button>
      </div>
    );
  }

  const field =
    "border-white/10 bg-white/[0.03] text-[var(--mk-text)] focus-visible:border-[var(--mk-bronze)]/50 focus-visible:ring-[var(--mk-bronze)]/20";

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <p className="text-xs text-[var(--mk-muted)]">
        Submissions are not sent yet — UI preview only.
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name" className="text-[var(--mk-text-2)]">
            Name
          </Label>
          <Input
            id="contact-name"
            name="name"
            required
            autoComplete="name"
            className={field}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email" className="text-[var(--mk-text-2)]">
            Email
          </Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={field}
          />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-company" className="text-[var(--mk-text-2)]">
            Company
          </Label>
          <Input
            id="contact-company"
            name="company"
            autoComplete="organization"
            className={field}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-size" className="text-[var(--mk-text-2)]">
            Company size
          </Label>
          <select
            id="contact-size"
            name="companySize"
            required
            defaultValue=""
            className={`flex h-9 w-full rounded-md border px-3 text-sm outline-none ${field}`}
          >
            <option value="" disabled className="bg-[#101010]">
              Select size
            </option>
            {SIZES.map((s) => (
              <option key={s} value={s} className="bg-[#101010]">
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-solve" className="text-[var(--mk-text-2)]">
          What are you looking to solve?
        </Label>
        <Input id="contact-solve" name="solve" required className={field} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message" className="text-[var(--mk-text-2)]">
          Message
        </Label>
        <Textarea
          id="contact-message"
          name="message"
          required
          rows={5}
          className={field}
        />
      </div>
      <MagneticButton type="submit">Send message</MagneticButton>
    </form>
  );
}
