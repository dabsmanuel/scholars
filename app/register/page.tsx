"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";
import { COUNTRIES } from "@/lib/countries";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!country) {
      setError("Please select your country.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register(fullName, email, password, country);
      router.push("/cv");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <p className="font-mono text-xs tracking-widest uppercase text-brass">Open a Case File</p>
      <h1 className="font-display text-3xl text-ink mt-2">Create your account</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="block text-sm text-ink-soft mb-1.5">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-rule px-4 py-2.5 bg-transparent focus:border-forest outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-soft mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-rule px-4 py-2.5 bg-transparent focus:border-forest outline-none"
          />
        </div>
        <div>
          <label className="block text-sm text-ink-soft mb-1.5">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-rule px-4 py-2.5 bg-transparent focus:border-forest outline-none"
          />
          <p className="text-xs text-slate mt-1">At least 8 characters.</p>
        </div>
        <div>
          <label className="block text-sm text-ink-soft mb-1.5">
            Country <span className="text-alert">*</span>
          </label>
          <select
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full border border-rule px-4 py-2.5 bg-paper focus:border-forest outline-none text-sm"
          >
            <option value="">Select your country…</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate mt-1">
            Used to tailor your experience and payment options.
          </p>
        </div>

        {error && <p className="text-alert text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-forest text-paper py-3 font-medium hover:bg-forest-light transition-colors disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-sm text-slate mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-forest underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
