"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { usesPaystack, COUNTRIES } from "@/lib/countries";

const STRIPE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!;
const STRIPE_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!;
const PAYSTACK_MONTHLY = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_MONTHLY!;
const PAYSTACK_ANNUAL = process.env.NEXT_PUBLIC_PAYSTACK_PLAN_ANNUAL!;

export default function PricingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<"monthly" | "annual" | "portal" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPro = user?.subscription?.plan === "pro" && user?.subscription?.status === "active";
  const isPaystackUser = user?.subscription?.gateway === "paystack";

  // Determine gateway from the registered country code
  const countryCode = user?.country || "";
  const usePaystack = usesPaystack(countryCode);
  const countryName = COUNTRIES.find((c) => c.code === countryCode)?.name;

  async function handleStripeCheckout(priceId: string, type: "monthly" | "annual") {
    if (!user) { router.push("/register"); return; }
    setLoading(type);
    setError(null);
    try {
      const { url } = await api.post<{ url: string }>("/billing/checkout", { priceId });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start checkout. Please try again.");
      setLoading(null);
    }
  }

  async function handlePaystackCheckout(planCode: string, type: "monthly" | "annual") {
    if (!user) { router.push("/register"); return; }
    setLoading(type);
    setError(null);
    try {
      const { url } = await api.post<{ url: string }>("/billing/paystack/checkout", { planCode });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't start checkout. Please try again.");
      setLoading(null);
    }
  }

  async function handleStripePortal() {
    setLoading("portal");
    try {
      const { url } = await api.post<{ url: string }>("/billing/portal");
      window.location.href = url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't open billing portal.");
      setLoading(null);
    }
  }

  async function handlePaystackCancel() {
    if (!confirm("Cancel your Pro subscription? You'll keep access until the end of your billing period.")) return;
    setLoading("portal");
    try {
      await api.post("/billing/paystack/cancel");
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't cancel subscription.");
      setLoading(null);
    }
  }

  const isAfrican = usePaystack;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      <p className="font-mono text-xs tracking-widest uppercase text-brass text-center">Pricing</p>
      <h1 className="font-display text-3xl sm:text-5xl text-ink mt-2 text-center leading-tight">
        One clear price.<br />No feature mazes.
      </h1>
      <p className="text-ink-soft mt-4 text-center max-w-xl mx-auto leading-relaxed">
        Free to explore. Upgrade when you're ready to build a real strategy.
      </p>

      {countryName && (
        <p className="text-center text-xs font-mono text-slate mt-3">
          Payment via {isAfrican ? "Paystack" : "Stripe"} · {countryName}
        </p>
      )}

      {error && <p className="text-alert text-sm text-center mt-6">{error}</p>}

      <div className="mt-12 grid sm:grid-cols-2 gap-6">
        {/* Free */}
        <div className="case-card p-8 flex flex-col">
          <p className="font-mono text-xs tracking-widest uppercase text-slate">Free</p>
          <p className="font-display text-4xl text-ink mt-2">$0</p>
          <p className="text-ink-soft text-sm mt-1">Forever</p>

          <ul className="mt-6 space-y-3 flex-1">
            {[
              "Browse all opportunities",
              "Save unlimited opportunities",
              "1 coaching generation to try the product",
              "Public opportunity breakdowns",
            ].map((f) => (
              <li key={f} className="flex gap-2 text-sm text-ink-soft">
                <span className="text-forest mt-0.5">✓</span>{f}
              </li>
            ))}
            {["Unlimited coaching generations", "Essay review & feedback"].map((f) => (
              <li key={f} className="flex gap-2 text-sm text-slate line-through">
                <span className="text-rule mt-0.5">×</span>{f}
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {!user ? (
              <button
                onClick={() => router.push("/register")}
                className="w-full border border-rule text-ink-soft px-5 py-2.5 text-sm"
              >
                Get started free
              </button>
            ) : (
              <p className="text-sm text-slate font-mono text-center">
                {isPro ? "Your previous plan" : "Your current plan"}
              </p>
            )}
          </div>
        </div>

        {/* Pro */}
        <div className="case-card p-8 flex flex-col" style={{ borderColor: "#1E4638", borderWidth: 1 }}>
          <p className="font-mono text-xs tracking-widest uppercase text-forest">Pro</p>
          <div className="mt-2 flex flex-col gap-1">
            <div>
              <span className="font-display text-4xl text-ink">$12</span>
              <span className="text-ink-soft text-sm"> / month</span>
            </div>
            <p className="text-brass text-xs font-mono">or $99/year — save 31%</p>
          </div>

          <ul className="mt-6 space-y-3 flex-1">
            {[
              "Everything in Free",
              "Unlimited coaching generations",
              "Essay review with line-by-line feedback",
              "Coaching refresh when CV changes",
              "Priority AI queue",
            ].map((f) => (
              <li key={f} className="flex gap-2 text-sm text-ink-soft">
                <span className="text-forest mt-0.5">✓</span>{f}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3">
            {isPro ? (
              // Manage existing subscription
              isPaystackUser ? (
                <button
                  onClick={handlePaystackCancel}
                  disabled={loading !== null}
                  className="w-full border border-rule text-ink-soft px-5 py-2.5 text-sm hover:border-alert hover:text-alert transition-colors disabled:opacity-60"
                >
                  {loading === "portal" ? "Processing…" : "Cancel subscription"}
                </button>
              ) : (
                <button
                  onClick={handleStripePortal}
                  disabled={loading !== null}
                  className="w-full border border-forest text-forest px-5 py-2.5 text-sm hover:bg-forest hover:text-paper transition-colors disabled:opacity-60"
                >
                  {loading === "portal" ? "Redirecting…" : "Manage subscription"}
                </button>
              )
            ) : isAfrican ? (
              // Paystack checkout
              <>
                <button
                  onClick={() => handlePaystackCheckout(PAYSTACK_MONTHLY, "monthly")}
                  disabled={loading !== null}
                  className="w-full bg-forest text-paper px-5 py-2.5 text-sm hover:bg-forest-light transition-colors disabled:opacity-60"
                >
                  {loading === "monthly" ? "Redirecting…" : "Subscribe monthly — $12/mo"}
                </button>
                <button
                  onClick={() => handlePaystackCheckout(PAYSTACK_ANNUAL, "annual")}
                  disabled={loading !== null}
                  className="w-full border border-brass text-brass px-5 py-2.5 text-sm hover:bg-brass hover:text-paper transition-colors disabled:opacity-60"
                >
                  {loading === "annual" ? "Redirecting…" : "Subscribe annually — $99/yr"}
                </button>
                <p className="text-xs text-slate font-mono text-center">
                  Powered by Paystack · Pay in your local currency
                </p>
              </>
            ) : (
              // Stripe checkout
              <>
                <button
                  onClick={() => handleStripeCheckout(STRIPE_MONTHLY, "monthly")}
                  disabled={loading !== null}
                  className="w-full bg-forest text-paper px-5 py-2.5 text-sm hover:bg-forest-light transition-colors disabled:opacity-60"
                >
                  {loading === "monthly" ? "Redirecting…" : "Subscribe monthly — $12/mo"}
                </button>
                <button
                  onClick={() => handleStripeCheckout(STRIPE_ANNUAL, "annual")}
                  disabled={loading !== null}
                  className="w-full border border-brass text-brass px-5 py-2.5 text-sm hover:bg-brass hover:text-paper transition-colors disabled:opacity-60"
                >
                  {loading === "annual" ? "Redirecting…" : "Subscribe annually — $99/yr"}
                </button>
                <p className="text-xs text-slate font-mono text-center">
                  Powered by Stripe · Cancel anytime
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-slate font-mono mt-10">
        Secure payments · Cancel anytime · No hidden fees
      </p>
    </div>
  );
}
