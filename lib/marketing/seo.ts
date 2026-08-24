import type { Metadata } from "next";

const SITE = "Technova CRM";
const DEFAULT_DESCRIPTION =
  "A modern CRM and business operations platform for agencies, software houses, consultants and teams to manage clients, bids, projects, finance and profitability.";

export function marketingMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path = "/",
}: {
  title: string;
  description?: string;
  path?: string;
}): Metadata {
  const fullTitle = title.includes("Technova") || title.includes("TechNova")
    ? title
    : `${title} · ${SITE}`;
  const url = path.startsWith("http") ? path : path;

  return {
    title: fullTitle,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: fullTitle,
      description,
      type: "website",
      siteName: SITE,
      url,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

export const HOME_METADATA = marketingMetadata({
  title: "Technova CRM — Win Clients. Deliver Projects. Know Your Business.",
  description: DEFAULT_DESCRIPTION,
  path: "/",
});
