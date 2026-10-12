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
    <div>
      <div className="mb-7 space-y-1.5">
        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.02em]">
          {title}
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
