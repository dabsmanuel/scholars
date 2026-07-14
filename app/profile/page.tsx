"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { COUNTRIES } from "@/lib/countries";
import { User } from "@/lib/types";

export default function ProfilePage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setCountry(user.country || "");
    }
  }, [user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    try {
      await api.patch<{ user: User }>("/auth/profile", { fullName, country });
      await refreshUser();
      setProfileMsg({ type: "ok", text: "Profile updated." });
    } catch (err) {
      setProfileMsg({ type: "err", text: err instanceof ApiError ? err.message : "Couldn't save changes." });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setSavingPassword(true);
    setPasswordMsg(null);
    try {
      await api.patch("/auth/profile", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMsg({ type: "ok", text: "Password changed." });
    } catch (err) {
      setPasswordMsg({ type: "err", text: err instanceof ApiError ? err.message : "Couldn't change password." });
    } finally {
      setSavingPassword(false);
    }
  }

  if (authLoading) {
    return <p className="max-w-2xl mx-auto px-4 py-20 text-slate font-mono text-sm">Loading…</p>;
  }
  if (!user) return null;

  const isPro = user.subscription?.plan === "pro" && user.subscription?.status === "active";
  const countryName = COUNTRIES.find((c) => c.code === user.country)?.name;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
      <p className="font-mono text-xs tracking-widest uppercase text-brass">Account</p>
      <h1 className="font-display text-2xl sm:text-4xl text-ink mt-2">Your profile</h1>

      {/* Subscription status */}
      <div className="mt-6 case-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase text-slate tracking-wide">Plan</p>
          <p className="font-medium text-ink mt-0.5">
            {isPro ? "Pro" : "Free"}
            {isPro && user.subscription.currentPeriodEnd && (
              <span className="text-xs text-slate font-mono ml-2 font-normal">
                renews {new Date(user.subscription.currentPeriodEnd).toLocaleDateString()}
              </span>
            )}
          </p>
        </div>
        {isPro ? (
          <Link
            href="/pricing"
            className="text-sm text-forest underline whitespace-nowrap"
          >
            Manage billing →
          </Link>
        ) : (
          <Link
            href="/pricing"
            className="stamp text-brass border-brass hover:bg-brass hover:text-paper transition-colors whitespace-nowrap"
          >
            Upgrade to Pro
          </Link>
        )}
      </div>

      {/* Profile details */}
      <form onSubmit={handleSaveProfile} className="mt-8 space-y-5">
        <h2 className="font-display text-xl text-ink border-b border-rule pb-2">Details</h2>

        <div>
          <label className="block text-sm text-ink-soft mb-1.5">Full name</label>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border border-rule px-4 py-2.5 bg-transparent focus:border-forest outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-ink-soft mb-1.5">Email</label>
          <input
            value={user.email}
            disabled
            className="w-full border border-rule px-4 py-2.5 bg-transparent text-slate text-sm cursor-not-allowed opacity-60"
          />
          <p className="text-xs text-slate mt-1">Email cannot be changed.</p>
        </div>

        <div>
          <label className="block text-sm text-ink-soft mb-1.5">Country</label>
          <select
            required
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full border border-rule px-4 py-2.5 bg-paper focus:border-forest outline-none text-sm"
          >
            <option value="">Select your country…</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
          {countryName && (
            <p className="text-xs text-slate mt-1">
              Payment gateway: {user.subscription?.gateway === "paystack" ? "Paystack" : country ? "Stripe" : "—"} · {countryName}
            </p>
          )}
        </div>

        {profileMsg && (
          <p className={`text-sm ${profileMsg.type === "ok" ? "text-forest" : "text-alert"}`}>
            {profileMsg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={savingProfile}
          className="bg-forest text-paper px-5 py-2.5 text-sm hover:bg-forest-light transition-colors disabled:opacity-60"
        >
          {savingProfile ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* Password change */}
      <form onSubmit={handleChangePassword} className="mt-10 space-y-5">
        <h2 className="font-display text-xl text-ink border-b border-rule pb-2">Change password</h2>

        <div>
          <label className="block text-sm text-ink-soft mb-1.5">Current password</label>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-rule px-4 py-2.5 bg-transparent focus:border-forest outline-none text-sm"
          />
        </div>

        <div>
          <label className="block text-sm text-ink-soft mb-1.5">New password</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-rule px-4 py-2.5 bg-transparent focus:border-forest outline-none text-sm"
          />
          <p className="text-xs text-slate mt-1">At least 8 characters.</p>
        </div>

        {passwordMsg && (
          <p className={`text-sm ${passwordMsg.type === "ok" ? "text-forest" : "text-alert"}`}>
            {passwordMsg.text}
          </p>
        )}

        <button
          type="submit"
          disabled={savingPassword}
          className="bg-forest text-paper px-5 py-2.5 text-sm hover:bg-forest-light transition-colors disabled:opacity-60"
        >
          {savingPassword ? "Updating…" : "Update password"}
        </button>
      </form>

      {/* Quick links */}
      <div className="mt-10 pt-6 border-t border-rule flex flex-wrap gap-4 text-sm">
        <Link href="/cv" className="text-forest underline">My CV →</Link>
        <Link href="/dashboard" className="text-forest underline">Case files →</Link>
        <Link href="/pricing" className="text-forest underline">Billing →</Link>
      </div>
    </div>
  );
}
