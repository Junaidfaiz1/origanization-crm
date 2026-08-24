import type { Metadata, Viewport } from "next";
import {
  Geist,
  Geist_Mono,
  Italiana,
  Outfit,
  Playfair_Display,
} from "next/font/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const marketingDisplay = Italiana({
  variable: "--font-marketing-display",
  subsets: ["latin"],
  weight: "400",
});

const marketingSans = Outfit({
  variable: "--font-marketing-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const marketingAccent = Playfair_Display({
  variable: "--font-marketing-accent",
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["italic", "normal"],
});

export const metadata: Metadata = {
  title: {
    default: "Technova CRM",
    template: "%s · Technova CRM",
  },
  description:
    "A modern CRM and business operations platform for agencies, software houses, consultants and teams.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f6f9" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${marketingDisplay.variable} ${marketingSans.variable} ${marketingAccent.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full overflow-x-hidden bg-background font-sans text-foreground">
        <ThemeProvider>
          {children}
          <Toaster richColors position="top-center" closeButton offset={16} />
        </ThemeProvider>
      </body>
    </html>
  );
}
