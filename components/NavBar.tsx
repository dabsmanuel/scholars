"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function NavBar() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const linkClass = "block px-4 py-3 text-sm text-ink-soft hover:text-forest hover:bg-paper-alt transition-colors";
  const isPro = user?.subscription?.plan === "pro";

  return (
    <header className="border-b border-rule bg-paper sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-display italic text-2xl text-ink">Passage</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm">
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
              <Link href="/profile" className="text-ink-soft hover:text-forest transition-colors">
                Profile
              </Link>
              {user.isAdmin && (
                <Link href="/admin" className="text-brass hover:opacity-70 transition-opacity font-mono text-xs uppercase tracking-wide">
                  Admin
                </Link>
              )}
              {!isPro && (
                <Link href="/pricing" className="stamp text-brass border-brass hover:bg-brass hover:text-paper transition-colors">
                  Upgrade
                </Link>
              )}
              <button onClick={logout} className="text-alert hover:opacity-70 transition-opacity">
                Sign out
              </button>
            </>
          )}
          {!loading && !user && (
            <>
              <Link href="/pricing" className="text-ink-soft hover:text-forest transition-colors">
                Pricing
              </Link>
              <Link href="/login" className="text-ink-soft hover:text-forest transition-colors">
                Sign in
              </Link>
              <Link href="/register" className="stamp text-forest border-forest hover:bg-forest hover:text-paper transition-colors">
                Get started
              </Link>
            </>
          )}
        </nav>

        {/* Mobile: right-side actions + hamburger */}
        <div className="flex sm:hidden items-center gap-3" ref={menuRef}>
          {!loading && !user && (
            <Link href="/register" className="stamp text-forest border-forest text-xs">
              Get started
            </Link>
          )}
          {!loading && user && !isPro && (
            <Link href="/pricing" className="stamp text-brass border-brass text-xs">
              Upgrade
            </Link>
          )}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
            className="flex flex-col gap-1.5 p-1"
          >
            <span className={`block h-0.5 w-5 bg-ink transition-transform origin-center ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 w-5 bg-ink transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-ink transition-transform origin-center ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </button>

          {/* Mobile dropdown */}
          {menuOpen && (
            <div className="absolute top-full left-0 right-0 bg-paper border-b border-rule shadow-sm z-40">
              <Link href="/" className={linkClass}>Discover</Link>
              {!loading && user && (
                <>
                  <Link href="/cv" className={linkClass}>My CV</Link>
                  <Link href="/dashboard" className={linkClass}>Case Files</Link>
                  <Link href="/profile" className={linkClass}>Profile</Link>
                  {user.isAdmin && (
                    <Link href="/admin" className="block px-4 py-3 text-sm text-brass hover:bg-paper-alt transition-colors font-mono uppercase tracking-wide">
                      Admin
                    </Link>
                  )}
                  <button
                    onClick={() => { logout(); setMenuOpen(false); }}
                    className="block w-full text-left px-4 py-3 text-sm text-alert hover:bg-paper-alt transition-colors"
                  >
                    Sign out
                  </button>
                </>
              )}
              {!loading && !user && (
                <>
                  <Link href="/pricing" className={linkClass}>Pricing</Link>
                  <Link href="/login" className={linkClass}>Sign in</Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
