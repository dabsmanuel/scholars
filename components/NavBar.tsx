"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function NavBar() {
  const { user, logout, loading } = useAuth();

  return (
    <header className="border-b border-rule bg-paper sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display italic text-2xl text-ink">Passage</span>
          <span className="hidden sm:inline font-mono text-[0.65rem] tracking-widest uppercase text-slate">
            Vol. I — Opportunities Abroad
          </span>
        </Link>

        <nav className="flex items-center gap-6 text-sm">
          <Link href="/" className="text-ink-soft hover:text-forest transition-colors">
            Discover
          </Link>
          {!loading && user && (
            <>
              <Link href="/cv" className="text-ink-soft hover:text-forest transition-colors">
                My CV
              </Link>
              <Link href="/dashboard" className="text-ink-soft hover:text-forest transition-colors">
                Case Files
              </Link>
              <button
                onClick={logout}
                className="text-alert hover:opacity-70 transition-opacity"
              >
                Sign out
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/login" className="text-ink-soft hover:text-forest transition-colors">
                Sign in
              </Link>
              <Link
                href="/register"
                className="stamp text-forest border-forest hover:bg-forest hover:text-paper transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
