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

export const metadata: Metadata = {
  title: "Toru — Scholarships & Opportunities for African Talent",
  description:
    "Find scholarships, study programs, and immigration or incubation pathways abroad, and get a genuinely personalized application strategy built from your own CV.",
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
              <span>Toru — case files for the applications that matter.</span>
              <span className="font-mono text-xs">BUILT FOR THE JOURNEY ABROAD</span>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
