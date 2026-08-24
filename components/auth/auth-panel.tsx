import type { ReactNode } from "react";

export function AuthPanel({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#101010]/90 p-6 shadow-[0_40px_120px_rgb(0_0_0_/_0.45)] backdrop-blur-sm sm:p-8">
      <div className="mb-6 space-y-2">
        <h1 className="mk-display text-3xl leading-tight text-[var(--mk-text)] sm:text-4xl">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-[var(--mk-text-2)]">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
