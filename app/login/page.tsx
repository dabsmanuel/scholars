"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sign you in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <p className="font-mono text-xs tracking-widest uppercase text-brass">Case File Access</p>
      <h1 className="font-display text-3xl text-ink mt-2">Sign in</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-rule px-4 py-2.5 bg-transparent focus:border-forest outline-none"
          />
        </div>

        {error && <p className="text-alert text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-forest text-paper py-3 font-medium hover:bg-forest-light transition-colors disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="text-sm text-slate mt-6">
        New here?{" "}
        <Link href="/register" className="text-forest underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
