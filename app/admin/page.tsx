"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface Stats {
  totalUsers: number;
  proUsers: number;
  totalOpportunities: number;
  totalApplications: number;
}

interface AdminUser {
  _id: string;
  fullName: string;
  email: string;
  isAdmin: boolean;
  coachingUsed: number;
  subscription: { plan: string; status: string };
  createdAt: string;
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

type Tab = "stats" | "opportunities" | "users";

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("stats");

  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!authLoading && (!user || !user.isAdmin)) {
      router.push("/");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    loadAll();
  }, [user]);

  async function loadAll() {
    setLoading(true);
    try {
      const [s, u, o] = await Promise.all([
        api.get<Stats>("/admin/stats"),
        api.get<{ users: AdminUser[] }>("/admin/users"),
        api.get<{ opportunities: Opportunity[] }>("/opportunities"),
      ]);
      setStats(s);
      setUsers(u.users);
      setOpportunities(o.opportunities);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load admin data.");
    } finally {
      setLoading(false);
    }
  }

  function openNewOpp() {
    setEditingOpp(null);
    setOppForm({
      title: "", provider: "", type: "scholarship", country: "",
      degreeLevel: "masters", fieldsOfStudy: "", deadline: "",
      objectives: "", eligibilitySummary: "", officialUrl: "",
      fundingCoverage: "", isActive: true,
    });
    setShowOppForm(true);
  }

  function openEditOpp(opp: Opportunity) {
    setEditingOpp(opp);
    setOppForm({
      title: opp.title,
      provider: opp.provider,
      type: opp.type,
      country: opp.country,
      degreeLevel: "masters",
      fieldsOfStudy: "",
      deadline: opp.deadline ? opp.deadline.slice(0, 10) : "",
      objectives: "",
      eligibilitySummary: "",
      officialUrl: "",
      fundingCoverage: "",
      isActive: opp.isActive,
    });
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

  if (authLoading || loading) {
    return <p className="max-w-5xl mx-auto px-4 py-20 text-slate font-mono text-sm">Loading admin panel…</p>;
  }

  if (!user?.isAdmin) return null;

  const TABS: { key: Tab; label: string }[] = [
    { key: "stats", label: "Overview" },
    { key: "opportunities", label: "Opportunities" },
    { key: "users", label: "Users" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-14">
      <p className="font-mono text-xs tracking-widest uppercase text-brass">Admin</p>
      <h1 className="font-display text-2xl sm:text-4xl text-ink mt-2">Control Panel</h1>

      {error && <p className="text-alert text-sm mt-4">{error}</p>}

      <div className="flex gap-1 mt-8 border-b border-rule">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-mono transition-colors ${
              tab === key
                ? "border-b-2 border-forest text-forest -mb-px"
                : "text-slate hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stats */}
      {tab === "stats" && stats && (
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: stats.totalUsers },
            { label: "Pro Subscribers", value: stats.proUsers },
            { label: "Active Opportunities", value: stats.totalOpportunities },
            { label: "Total Applications", value: stats.totalApplications },
          ].map(({ label, value }) => (
            <div key={label} className="case-card p-5">
              <p className="text-xs font-mono text-slate uppercase tracking-wide">{label}</p>
              <p className="font-display text-3xl text-ink mt-1">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Opportunities */}
      {tab === "opportunities" && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-slate">{opportunities.length} opportunities</p>
            <button
              onClick={openNewOpp}
              className="bg-forest text-paper px-4 py-2 text-sm hover:bg-forest-light transition-colors"
            >
              + New opportunity
            </button>
          </div>

          {showOppForm && (
            <form onSubmit={handleSaveOpp} className="case-card p-6 mb-6 space-y-4">
              <h2 className="font-display text-xl text-ink">
                {editingOpp ? "Edit opportunity" : "New opportunity"}
              </h2>
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
                  <select
                    value={oppForm.type}
                    onChange={(e) => setOppForm((p) => ({ ...p, type: e.target.value }))}
                    className="w-full border border-rule px-3 py-2 text-sm bg-paper focus:border-forest outline-none"
                  >
                    {["scholarship", "study_program", "immigration_pathway", "incubator", "fellowship"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono uppercase text-slate block mb-1">Degree Level</label>
                  <select
                    value={oppForm.degreeLevel}
                    onChange={(e) => setOppForm((p) => ({ ...p, degreeLevel: e.target.value }))}
                    className="w-full border border-rule px-3 py-2 text-sm bg-paper focus:border-forest outline-none"
                  >
                    {["undergraduate", "masters", "phd", "postdoc", "professional", "none"].map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono uppercase text-slate block mb-1">Deadline</label>
                  <input
                    type="date"
                    value={oppForm.deadline}
                    onChange={(e) => setOppForm((p) => ({ ...p, deadline: e.target.value }))}
                    className="w-full border border-rule px-3 py-2 text-sm bg-transparent focus:border-forest outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-slate block mb-1">Objectives</label>
                <textarea
                  required
                  rows={3}
                  value={oppForm.objectives}
                  onChange={(e) => setOppForm((p) => ({ ...p, objectives: e.target.value }))}
                  className="w-full border border-rule px-3 py-2 text-sm bg-transparent focus:border-forest outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-mono uppercase text-slate block mb-1">Eligibility Summary</label>
                <textarea
                  required
                  rows={3}
                  value={oppForm.eligibilitySummary}
                  onChange={(e) => setOppForm((p) => ({ ...p, eligibilitySummary: e.target.value }))}
                  className="w-full border border-rule px-3 py-2 text-sm bg-transparent focus:border-forest outline-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-forest text-paper px-5 py-2.5 text-sm hover:bg-forest-light transition-colors disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowOppForm(false)}
                  className="border border-rule text-ink-soft px-5 py-2.5 text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            {opportunities.map((opp) => (
              <div key={opp._id} className="case-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-ink text-sm truncate">{opp.title}</p>
                  <p className="text-xs text-slate font-mono mt-0.5">
                    {opp.provider} · {opp.country} · {opp.type}
                    {opp.deadline && ` · ${new Date(opp.deadline).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  {!opp.isActive && (
                    <span className="text-xs font-mono text-alert">INACTIVE</span>
                  )}
                  <button
                    onClick={() => openEditOpp(opp)}
                    className="text-xs text-forest underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteOpp(opp._id)}
                    className="text-xs text-alert underline"
                  >
                    Deactivate
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users */}
      {tab === "users" && (
        <div className="mt-6 space-y-2">
          {users.map((u) => (
            <div key={u._id} className="case-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink text-sm">{u.fullName}</p>
                <p className="text-xs text-slate font-mono mt-0.5 truncate">
                  {u.email} · joined {new Date(u.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-mono px-2 py-0.5 border ${
                  u.subscription.plan === "pro"
                    ? "border-forest text-forest"
                    : "border-rule text-slate"
                }`}>
                  {u.subscription.plan.toUpperCase()}
                </span>
                <span className="text-xs text-slate font-mono">
                  {u.coachingUsed} coaching
                </span>
                {u.isAdmin && (
                  <span className="text-xs font-mono text-brass">ADMIN</span>
                )}
                <button
                  onClick={() => handleToggleAdmin(u)}
                  className="text-xs text-ink-soft underline"
                >
                  {u.isAdmin ? "Remove admin" : "Make admin"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
