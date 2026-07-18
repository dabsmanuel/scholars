"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface PaymentRecord {
  gateway: "stripe" | "paystack";
  amountLocal: number;
  currency: string;
  paidAt: string;
  description: string;
  reference?: string;
}

interface AdminStats {
  totalUsers: number;
  proUsers: number;
  trialingUsers: number;
  totalOpportunities: number;
  totalApplications: number;
  totalCelebrations: number;
  pendingCelebrations: number;
  totalRevenueUSD: number;
  paystackRevenue: { currency: string; total: number; count: number }[];
  totalPaystackPayments: number;
}

interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  country?: string;
  isAdmin: boolean;
  coachingUsed: number;
  subscription: {
    plan: string;
    status: string;
    gateway?: string;
    currentPeriodEnd?: string;
    trialStartedAt?: string;
  };
  paymentHistory: PaymentRecord[];
  createdAt: string;
}

interface AdminCelebration {
  _id: string;
  displayName: string;
  country?: string;
  opportunityTitle: string;
  opportunityProvider?: string;
  awardType: string;
  message: string;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
  user?: { fullName: string; email: string };
}

interface Opportunity {
  _id: string;
  title: string;
  provider: string;
  type: string;
  country: string;
  deadline?: string;
  isActive: boolean;
}

type Tab = "stats" | "opportunities" | "users" | "celebrations";

function trialDaysLeft(periodEnd?: string): number | null {
  if (!periodEnd) return null;
  const ms = new Date(periodEnd).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function userRevenue(history: PaymentRecord[]): {
  usdTotal: number;
  paystackByCurrency: { currency: string; total: number; count: number }[];
} {
  let usdTotal = 0;
  const paystackMap: Record<string, { total: number; count: number }> = {};
  for (const p of history) {
    if (p.gateway === "stripe" && p.currency === "usd") usdTotal += p.amountLocal / 100;
    if (p.gateway === "paystack" && p.amountLocal > 0) {
      const key = p.currency.toUpperCase();
      if (!paystackMap[key]) paystackMap[key] = { total: 0, count: 0 };
      paystackMap[key].total += p.amountLocal / 100;
      paystackMap[key].count++;
    }
  }
  return {
    usdTotal,
    paystackByCurrency: Object.entries(paystackMap).map(([currency, v]) => ({ currency, ...v })),
  };
}

function formatPaystackAmount(total: number, currency: string): string {
  return `${total.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${currency}`;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stats");

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [celebrations, setCelebrations] = useState<AdminCelebration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  // Opportunity form
  const [showOppForm, setShowOppForm] = useState(false);
  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);
  const [oppForm, setOppForm] = useState({
    title: "", provider: "", type: "scholarship", country: "",
    degreeLevel: "masters", fieldsOfStudy: "", deadline: "",
    objectives: "", eligibilitySummary: "", officialUrl: "",
    fundingCoverage: "", isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [essayPrompts, setEssayPrompts] = useState<
    { promptId: string; label: string; question: string; maxCharacters: string; maxWords: string; guidance: string }[]
  >([]);

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) router.push("/");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadAll();
  }, [user]);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, u, o, c] = await Promise.all([
        api.get<AdminStats>("/admin/stats"),
        api.get<{ users: AdminUser[] }>("/admin/users"),
        api.get<{ opportunities: Opportunity[] }>("/opportunities"),
        api.get<{ celebrations: AdminCelebration[] }>("/admin/celebrations"),
      ]);
      setStats(s);
      setUsers(u.users);
      setOpportunities(o.opportunities);
      setCelebrations(c.celebrations);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  function openNewOpp() {
    setEditingOpp(null);
    setOppForm({ title: "", provider: "", type: "scholarship", country: "", degreeLevel: "masters", fieldsOfStudy: "", deadline: "", objectives: "", eligibilitySummary: "", officialUrl: "", fundingCoverage: "", isActive: true });
    setEssayPrompts([]);
    setShowOppForm(true);
  }

  function openEditOpp(opp: Opportunity) {
    setEditingOpp(opp);
    setOppForm({ title: opp.title, provider: opp.provider, type: opp.type, country: opp.country, degreeLevel: "masters", fieldsOfStudy: "", deadline: opp.deadline ? opp.deadline.slice(0, 10) : "", objectives: "", eligibilitySummary: "", officialUrl: "", fundingCoverage: "", isActive: opp.isActive });
    setEssayPrompts([]);
    setShowOppForm(true);
  }

  async function handleSaveOpp(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...oppForm,
        fieldsOfStudy: oppForm.fieldsOfStudy.split(",").map((s) => s.trim()).filter(Boolean),
        deadline: oppForm.deadline || undefined,
        requirements: [],
        essayPrompts: essayPrompts.filter((p) => p.promptId && p.label && p.question).map((p) => ({
          promptId: p.promptId, label: p.label, question: p.question,
          maxCharacters: p.maxCharacters ? parseInt(p.maxCharacters, 10) : undefined,
          maxWords: p.maxWords ? parseInt(p.maxWords, 10) : undefined,
          guidance: p.guidance || undefined,
        })),
      };
      if (editingOpp) {
        await api.patch(`/admin/opportunities/${editingOpp._id}`, body);
      } else {
        await api.post("/admin/opportunities", body);
      }
      setShowOppForm(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save opportunity.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteOpp(id: string) {
    if (!confirm("Deactivate this opportunity?")) return;
    try {
      await api.delete(`/admin/opportunities/${id}`);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to deactivate opportunity.");
    }
  }

  async function handleToggleAdmin(u: AdminUser) {
    try {
      await api.patch(`/admin/users/${u._id}/admin`, { isAdmin: !u.isAdmin });
      setUsers((prev) => prev.map((x) => x._id === u._id ? { ...x, isAdmin: !u.isAdmin } : x));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update user.");
    }
  }

  async function handleCelebration(id: string, update: { isApproved?: boolean; isFeatured?: boolean }) {
    try {
      const { celebration } = await api.patch<{ celebration: AdminCelebration }>(`/admin/celebrations/${id}`, update);
      setCelebrations((prev) => prev.map((c) => c._id === id ? celebration : c));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update celebration.");
    }
  }

  async function handleDeleteCelebration(id: string) {
    if (!confirm("Delete this celebration?")) return;
    try {
      await api.delete(`/admin/celebrations/${id}`);
      setCelebrations((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete.");
    }
  }

  if (authLoading || loading) {
    return <p className="max-w-5xl mx-auto px-4 py-20 text-slate font-mono text-sm">Loading admin panel…</p>;
  }

  if (!user?.isAdmin) return null;

  const TABS: { key: Tab; label: string; badge?: number }[] = [
    { key: "stats", label: "Overview" },
    { key: "opportunities", label: "Opportunities" },
    { key: "users", label: "Users", badge: users.length },
    { key: "celebrations", label: "Celebrations", badge: stats?.pendingCelebrations || undefined },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
      <p className="font-mono text-xs tracking-widest uppercase text-brass">Admin</p>
      <h1 className="font-display text-2xl sm:text-4xl text-ink mt-2">Control Panel</h1>

      {error && <p className="text-alert text-sm mt-4">{error}</p>}

      <div className="flex gap-1 mt-8 border-b border-rule">
        {TABS.map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-mono transition-colors flex items-center gap-1.5 ${
              tab === key ? "border-b-2 border-forest text-forest -mb-px" : "text-slate hover:text-ink"
            }`}
          >
            {label}
            {badge ? (
              <span className="text-xs bg-brass text-white px-1.5 py-0.5 rounded-full font-mono leading-none">
                {badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === "stats" && stats && (
        <div className="mt-8 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total users", value: stats.totalUsers },
              { label: "Pro subscribers", value: stats.proUsers },
              { label: "On free trial", value: stats.trialingUsers },
              { label: "Active opportunities", value: stats.totalOpportunities },
            ].map(({ label, value }) => (
              <div key={label} className="case-card p-5">
                <p className="text-xs font-mono text-slate uppercase tracking-wide">{label}</p>
                <p className="font-display text-3xl text-ink mt-1">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="case-card p-5" style={{ borderLeft: "3px solid #2563EB" }}>
              <p className="text-xs font-mono text-slate uppercase tracking-wide">Stripe revenue (USD)</p>
              <p className="font-display text-3xl text-ink mt-1">${stats.totalRevenueUSD.toFixed(2)}</p>
              <p className="text-xs text-slate font-mono mt-1">Stripe paid subscriptions</p>
            </div>
            <div className="case-card p-5" style={{ borderLeft: "3px solid #D97706" }}>
              <p className="text-xs font-mono text-slate uppercase tracking-wide">Paystack revenue</p>
              {stats.paystackRevenue.length > 0 ? (
                <div className="mt-1 space-y-0.5">
                  {stats.paystackRevenue.map((r) => (
                    <p key={r.currency} className="font-display text-xl text-ink">
                      {r.total.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-base">{r.currency}</span>
                      <span className="text-xs text-slate font-mono ml-2 align-middle">{r.count}×</span>
                    </p>
                  ))}
                </div>
              ) : (
                <p className="font-display text-3xl text-ink mt-1">—</p>
              )}
              <p className="text-xs text-slate font-mono mt-1">{stats.totalPaystackPayments} total payments</p>
            </div>
            <div className="case-card p-5">
              <p className="text-xs font-mono text-slate uppercase tracking-wide">Applications</p>
              <p className="font-display text-3xl text-ink mt-1">{stats.totalApplications}</p>
            </div>
            <div className="case-card p-5">
              <p className="text-xs font-mono text-slate uppercase tracking-wide">Winner celebrations</p>
              <p className="font-display text-3xl text-ink mt-1">{stats.totalCelebrations}</p>
              {stats.pendingCelebrations > 0 && (
                <p className="text-xs text-brass font-mono mt-1">{stats.pendingCelebrations} pending review</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Opportunities ── */}
      {tab === "opportunities" && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate">{opportunities.length} opportunities</p>
            <button onClick={openNewOpp} className="bg-forest text-paper px-4 py-2 text-sm hover:bg-forest-light transition-colors">
              + New opportunity
            </button>
          </div>

          {showOppForm && (
            <form onSubmit={handleSaveOpp} className="case-card p-6 mb-6 space-y-4">
              <h2 className="font-display text-xl text-ink">{editingOpp ? "Edit opportunity" : "New opportunity"}</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {(["title", "provider", "country", "officialUrl", "fundingCoverage", "fieldsOfStudy"] as const).map((field) => (
                  <div key={field}>
                    <label className="text-xs font-mono uppercase text-slate block mb-1">{field}</label>
                    <input
                      required={["title", "provider", "country", "officialUrl", "fieldsOfStudy"].includes(field)}
                      value={(oppForm as any)[field]}
                      onChange={(e) => setOppForm((p) => ({ ...p, [field]: e.target.value }))}
                      placeholder={field === "fieldsOfStudy" ? "comma-separated" : ""}
                      className="w-full border border-rule px-3 py-2 text-sm bg-transparent focus:border-forest outline-none"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-mono uppercase text-slate block mb-1">Type</label>
                  <select value={oppForm.type} onChange={(e) => setOppForm((p) => ({ ...p, type: e.target.value }))} className="w-full border border-rule px-3 py-2 text-sm bg-paper focus:border-forest outline-none">
                    {["scholarship", "study_program", "immigration_pathway", "incubator", "fellowship"].map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono uppercase text-slate block mb-1">Degree Level</label>
                  <select value={oppForm.degreeLevel} onChange={(e) => setOppForm((p) => ({ ...p, degreeLevel: e.target.value }))} className="w-full border border-rule px-3 py-2 text-sm bg-paper focus:border-forest outline-none">
                    {["undergraduate", "masters", "phd", "postdoc", "professional", "none"].map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono uppercase text-slate block mb-1">Deadline</label>
                  <input type="date" value={oppForm.deadline} onChange={(e) => setOppForm((p) => ({ ...p, deadline: e.target.value }))} className="w-full border border-rule px-3 py-2 text-sm bg-transparent focus:border-forest outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-slate block mb-1">Objectives</label>
                <textarea required rows={3} value={oppForm.objectives} onChange={(e) => setOppForm((p) => ({ ...p, objectives: e.target.value }))} className="w-full border border-rule px-3 py-2 text-sm bg-transparent focus:border-forest outline-none" />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-slate block mb-1">Eligibility Summary</label>
                <textarea required rows={3} value={oppForm.eligibilitySummary} onChange={(e) => setOppForm((p) => ({ ...p, eligibilitySummary: e.target.value }))} className="w-full border border-rule px-3 py-2 text-sm bg-transparent focus:border-forest outline-none" />
              </div>

              {/* Essay Prompts */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-mono uppercase text-slate">Essay Prompts</label>
                  <button type="button" onClick={() => setEssayPrompts((p) => [...p, { promptId: "", label: "", question: "", maxCharacters: "", maxWords: "", guidance: "" }])} className="text-xs text-forest border border-forest px-2 py-1 hover:bg-forest hover:text-paper transition-colors">
                    + Add prompt
                  </button>
                </div>
                {essayPrompts.length === 0 && <p className="text-xs text-slate font-mono">No essay prompts — add one if this opportunity has specific essay questions.</p>}
                {essayPrompts.map((p, i) => (
                  <div key={i} className="border border-rule p-4 mb-3 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate font-mono block mb-1">Prompt ID (slug)</label>
                        <input value={p.promptId} onChange={(e) => setEssayPrompts((prev) => prev.map((x, j) => j === i ? { ...x, promptId: e.target.value } : x))} placeholder="e.g. why_sg" className="w-full border border-rule px-2 py-1.5 text-xs bg-transparent focus:border-forest outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate font-mono block mb-1">Short label</label>
                        <input value={p.label} onChange={(e) => setEssayPrompts((prev) => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="e.g. Why Singapore?" className="w-full border border-rule px-2 py-1.5 text-xs bg-transparent focus:border-forest outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate font-mono block mb-1">Full question text</label>
                      <textarea rows={3} value={p.question} onChange={(e) => setEssayPrompts((prev) => prev.map((x, j) => j === i ? { ...x, question: e.target.value } : x))} placeholder="Paste the exact question from the application form…" className="w-full border border-rule px-2 py-1.5 text-xs bg-transparent focus:border-forest outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate font-mono block mb-1">Max characters (optional)</label>
                        <input type="number" value={p.maxCharacters} onChange={(e) => setEssayPrompts((prev) => prev.map((x, j) => j === i ? { ...x, maxCharacters: e.target.value } : x))} placeholder="e.g. 1000" className="w-full border border-rule px-2 py-1.5 text-xs bg-transparent focus:border-forest outline-none" />
                      </div>
                      <div>
                        <label className="text-xs text-slate font-mono block mb-1">Max words (optional)</label>
                        <input type="number" value={p.maxWords} onChange={(e) => setEssayPrompts((prev) => prev.map((x, j) => j === i ? { ...x, maxWords: e.target.value } : x))} placeholder="e.g. 300" className="w-full border border-rule px-2 py-1.5 text-xs bg-transparent focus:border-forest outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-slate font-mono block mb-1">Extra guidance (optional)</label>
                      <input value={p.guidance} onChange={(e) => setEssayPrompts((prev) => prev.map((x, j) => j === i ? { ...x, guidance: e.target.value } : x))} placeholder="e.g. Focus on your experience in Singapore or ASEAN region" className="w-full border border-rule px-2 py-1.5 text-xs bg-transparent focus:border-forest outline-none" />
                    </div>
                    <button type="button" onClick={() => setEssayPrompts((prev) => prev.filter((_, j) => j !== i))} className="text-xs text-alert underline">Remove</button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button type="submit" disabled={saving} className="bg-forest text-paper px-5 py-2.5 text-sm hover:bg-forest-light transition-colors disabled:opacity-60">{saving ? "Saving…" : "Save"}</button>
                <button type="button" onClick={() => setShowOppForm(false)} className="border border-rule text-ink-soft px-5 py-2.5 text-sm">Cancel</button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {opportunities.map((opp) => (
              <div key={opp._id} className="case-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink text-sm truncate">{opp.title}</p>
                  <p className="text-xs text-slate font-mono mt-0.5">{opp.provider} · {opp.country} · {opp.type}{opp.deadline && ` · ${new Date(opp.deadline).toLocaleDateString()}`}</p>
                </div>
                <div className="flex gap-3 shrink-0">
                  {!opp.isActive && <span className="text-xs font-mono text-alert">INACTIVE</span>}
                  <button onClick={() => openEditOpp(opp)} className="text-xs text-forest underline">Edit</button>
                  <button onClick={() => handleDeleteOpp(opp._id)} className="text-xs text-alert underline">Deactivate</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Users ── */}
      {tab === "users" && (
        <div className="mt-6 space-y-2">
          {users.map((u) => {
            const { usdTotal, paystackByCurrency } = userRevenue(u.paymentHistory ?? []);
            const daysLeft = u.subscription.status === "trialing" ? trialDaysLeft(u.subscription.currentPeriodEnd) : null;
            const isExpanded = expandedUser === u._id;

            return (
              <div key={u._id} className="case-card overflow-hidden">
                <div
                  className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 cursor-pointer hover:bg-surface/50 transition-colors"
                  onClick={() => setExpandedUser(isExpanded ? null : u._id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-ink text-sm">{u.fullName}</p>
                      {u.isAdmin && <span className="text-xs font-mono text-brass">ADMIN</span>}
                      {u.country && <span className="text-xs text-slate font-mono">{u.country}</span>}
                    </div>
                    <p className="text-xs text-slate font-mono mt-0.5 truncate">
                      {u.email} · joined {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Plan badge */}
                    <span className={`text-xs font-mono px-2 py-0.5 border ${
                      u.subscription.plan === "pro"
                        ? u.subscription.status === "trialing"
                          ? "border-brass text-brass"
                          : "border-forest text-forest"
                        : "border-rule text-slate"
                    }`}>
                      {u.subscription.status === "trialing" ? "TRIAL" : u.subscription.plan.toUpperCase()}
                    </span>

                    {/* Trial countdown */}
                    {daysLeft !== null && (
                      <span className={`text-xs font-mono px-2 py-0.5 rounded ${
                        daysLeft <= 2 ? "bg-red-50 text-alert" : daysLeft <= 4 ? "bg-amber-50 text-brass" : "bg-blue-50 text-forest"
                      }`}>
                        {daysLeft}d left
                      </span>
                    )}

                    {/* Gateway */}
                    {u.subscription.gateway && (
                      <span className="text-xs text-slate font-mono">{u.subscription.gateway}</span>
                    )}

                    {/* Revenue */}
                    {usdTotal > 0 && (
                      <span className="text-xs font-mono text-forest">${usdTotal.toFixed(2)}</span>
                    )}
                    {paystackByCurrency.map((r) => (
                      <span key={r.currency} className="text-xs font-mono text-brass">
                        {formatPaystackAmount(r.total, r.currency)}
                      </span>
                    ))}

                    <span className="text-slate text-xs font-mono">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-rule px-4 py-4 bg-surface/30 space-y-4">
                    {/* Subscription detail */}
                    <div className="grid sm:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs font-mono text-slate uppercase mb-1">Plan status</p>
                        <p className="text-sm text-ink">{u.subscription.plan} · {u.subscription.status}</p>
                      </div>
                      {u.subscription.currentPeriodEnd && (
                        <div>
                          <p className="text-xs font-mono text-slate uppercase mb-1">
                            {u.subscription.status === "trialing" ? "Trial ends" : "Period ends"}
                          </p>
                          <p className="text-sm text-ink">{new Date(u.subscription.currentPeriodEnd).toLocaleDateString()}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-mono text-slate uppercase mb-1">Coaching used</p>
                        <p className="text-sm text-ink">{u.coachingUsed}</p>
                      </div>
                    </div>

                    {/* Payment history */}
                    {u.paymentHistory && u.paymentHistory.length > 0 ? (
                      <div>
                        <p className="text-xs font-mono text-slate uppercase mb-2">Payment history</p>
                        <div className="space-y-1">
                          {[...u.paymentHistory].reverse().map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b border-rule last:border-0">
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-slate">{new Date(p.paidAt).toLocaleDateString()}</span>
                                <span className="text-ink">{p.description}</span>
                                <span className={`font-mono px-1.5 py-0.5 rounded text-xs ${p.gateway === "stripe" ? "bg-blue-50 text-forest" : "bg-amber-50 text-brass"}`}>{p.gateway}</span>
                              </div>
                              <span className="font-mono text-ink font-medium">
                                {p.gateway === "stripe" && p.currency === "usd"
                                  ? `$${(p.amountLocal / 100).toFixed(2)}`
                                  : `${(p.amountLocal / 100).toFixed(0)} ${p.currency.toUpperCase()}`}
                              </span>
                            </div>
                          ))}
                        </div>
                        {usdTotal > 0 && (
                          <p className="text-xs font-mono text-forest mt-2">Stripe total: ${usdTotal.toFixed(2)}</p>
                        )}
                        {paystackByCurrency.map((r) => (
                          <p key={r.currency} className="text-xs font-mono text-brass mt-1">
                            Paystack total: {formatPaystackAmount(r.total, r.currency)} ({r.count} payment{r.count !== 1 ? "s" : ""})
                          </p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate font-mono">No payment records yet.</p>
                    )}

                    <div className="flex gap-3 pt-1">
                      <button onClick={() => handleToggleAdmin(u)} className="text-xs text-ink-soft underline">
                        {u.isAdmin ? "Remove admin" : "Make admin"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Celebrations ── */}
      {tab === "celebrations" && (
        <div className="mt-6 space-y-3">
          {celebrations.length === 0 && (
            <p className="text-slate font-mono text-sm">No celebrations submitted yet.</p>
          )}
          {celebrations.map((c) => (
            <div key={c._id} className={`case-card p-5 ${!c.isApproved ? "opacity-60 border-l-4 border-slate" : c.isFeatured ? "border-l-4 border-brass" : ""}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-ink text-sm">{c.displayName}</p>
                    {c.country && <span className="text-xs text-slate font-mono">{c.country}</span>}
                    <span className="text-xs font-mono text-slate">{new Date(c.createdAt).toLocaleDateString()}</span>
                    {c.isFeatured && <span className="text-xs font-mono bg-amber-50 text-brass border border-amber-200 px-1.5 py-0.5 rounded">Featured</span>}
                    {!c.isApproved && <span className="text-xs font-mono bg-slate-100 text-slate px-1.5 py-0.5 rounded">Hidden</span>}
                  </div>
                  <p className="text-xs text-forest font-mono mt-0.5">{c.opportunityTitle}{c.opportunityProvider && ` · ${c.opportunityProvider}`}</p>
                  {c.user && <p className="text-xs text-slate font-mono mt-0.5">User: {c.user.fullName} ({c.user.email})</p>}
                  <p className="text-sm text-ink-soft mt-2 leading-relaxed">{c.message}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-3 border-t border-rule">
                <button
                  onClick={() => handleCelebration(c._id, { isApproved: !c.isApproved })}
                  className="text-xs underline text-ink-soft"
                >
                  {c.isApproved ? "Hide" : "Approve"}
                </button>
                <button
                  onClick={() => handleCelebration(c._id, { isFeatured: !c.isFeatured })}
                  className="text-xs underline text-brass"
                >
                  {c.isFeatured ? "Unfeature" : "Feature"}
                </button>
                <button
                  onClick={() => handleDeleteCelebration(c._id)}
                  className="text-xs underline text-alert"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
