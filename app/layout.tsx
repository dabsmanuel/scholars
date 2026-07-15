import type { Metadata } from "next";
import { Fraunces, Source_Serif_4, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import NavBar from "@/components/NavBar";

const display = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});

const body = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://passage.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Passage — Scholarships & Opportunities for African Talent",
    template: "%s | Passage",
  },
  description:
    "Find scholarships, study programs, and immigration or incubation pathways abroad. Get a personalized application strategy built from your own CV.",
  keywords: ["scholarships", "study abroad", "fellowships", "Nigeria", "Africa", "opportunities", "application coaching"],
  openGraph: {
    type: "website",
    siteName: "Passage",
    title: "Passage — Scholarships & Opportunities for African Talent",
    description:
      "Find scholarships, study programs, and immigration or incubation pathways abroad. Get a personalized application strategy built from your own CV.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Passage — Scholarships & Opportunities for African Talent",
    description:
      "Find scholarships, study programs, and immigration or incubation pathways abroad. Get a personalized application strategy built from your own CV.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${body.variable} ${mono.variable} font-body`}>
        <AuthProvider>
          <NavBar />
          <main className="min-h-screen">{children}</main>
          <footer className="border-t border-rule mt-24">
            <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row justify-between gap-2 text-sm text-slate">
              <span>Passage — case files for the applications that matter.</span>
              <span className="font-mono text-xs">BUILT FOR THE JOURNEY ABROAD</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
