"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Opportunity, RecommendationMatch } from "@/lib/types";
import OpportunityCard from "@/components/OpportunityCard";
import UpgradePrompt from "@/components/UpgradePrompt";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const TYPES = [
  { value: "", label: "All types" },
  { value: "scholarship", label: "Scholarships" },
  { value: "fellowship", label: "Fellowships" },
  { value: "study_program", label: "Study Programs" },
  { value: "immigration_pathway", label: "Immigration Pathways" },
];

const DEGREE_LEVELS = [
  { value: "", label: "Any level" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "postdoc", label: "Postdoc" },
  { value: "professional", label: "Professional" },
  { value: "none", label: "No degree req." },
];

const PAGE_SIZE = 20;

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const TIER_CONFIG = {
  strong: { label: "Strong fit", color: "bg-blue-50 text-forest border border-blue-200" },
  good: { label: "Good fit", color: "bg-amber-50 text-brass border border-amber-200" },
  moderate: { label: "Moderate fit", color: "bg-slate-50 text-slate border border-slate-200" },
  weak: { label: "Weak fit", color: "bg-red-50 text-alert border border-red-200" },
};

function ForYouPanel() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<RecommendationMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const isPro =
    user?.subscription?.plan === "pro" &&
    (user?.subscription?.status === "active" || user?.subscription?.status === "trialing");

  const fetchRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ recommendations: RecommendationMatch[] }>("/opportunities/recommended");
      setMatches(data.recommendations);
    } catch (err: any) {
      setError(err.message || "Couldn't load recommendations.");
    } finally {
      setLoading(false);
      setFetched(true);
    }
  }, []);

  useEffect(() => {
    if (!user || !isPro || !user.cvData) return;
    fetchRecommendations();
  }, [user, isPro, fetchRecommendations]);

  if (!user) {
    return (
      <div className="mt-10 case-card p-8 max-w-lg">
        <p className="font-display text-xl text-ink">Sign in to see your matches</p>
        <p className="text-ink-soft mt-2 text-sm leading-relaxed">
          Create an account, upload your CV, and we'll rank every opportunity by how well it fits your actual background.
        </p>
        <div className="mt-5 flex gap-3">
          <Link href="/login" className="btn-secondary text-sm px-4 py-2">Sign in</Link>
          <Link href="/register" className="btn-primary text-sm px-4 py-2">Create account</Link>
        </div>
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="mt-6">
        <UpgradePrompt feature="recommendations" />
      </div>
    );
  }

  if (!user.cvData) {
    return (
      <div className="mt-10 case-card p-8 max-w-lg">
        <p className="font-display text-xl text-ink">Upload your CV to unlock matches</p>
        <p className="text-ink-soft mt-2 text-sm leading-relaxed">
          We read your actual education, experience, and skills — then rank every opportunity against it. No generic suggestions.
        </p>
        <Link href="/cv" className="btn-primary inline-flex mt-5 text-sm">Upload CV →</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-6">
          <span className="inline-block w-2 h-2 rounded-full bg-forest animate-pulse" />
          <p className="text-sm font-mono text-slate">Scoring opportunities against your CV…</p>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="case-card p-5 animate-pulse">
              <div className="h-4 bg-rule rounded w-2/3 mb-3" />
              <div className="h-3 bg-rule rounded w-1/3 mb-2" />
              <div className="h-3 bg-rule rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-10">
        <p className="text-alert text-sm">{error}</p>
        <button onClick={fetchRecommendations} className="mt-3 text-sm text-forest underline">
          Try again
        </button>
      </div>
    );
  }

  if (fetched && matches.length === 0) {
    return (
      <div className="mt-10 case-card p-8 max-w-lg">
        <p className="font-display text-xl text-ink">No strong matches yet</p>
        <p className="text-ink-soft mt-2 text-sm leading-relaxed">
          We didn't find opportunities that clearly match your profile. This improves as more opportunities are added.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <p className="text-xs font-mono text-slate mb-6">
        {matches.length} opportunit{matches.length !== 1 ? "ies" : "y"} sorted by how well your profile matches the criteria —{" "}
        <button onClick={fetchRecommendations} className="text-forest underline">
          refresh
        </button>
      </p>

      <div className="space-y-3">
        {matches.map((match) => {
          const tier = TIER_CONFIG[match.fitTier] ?? TIER_CONFIG.moderate;
          const opp = match.opportunity;
          if (!opp) return null;

          return (
            <Link
              key={match.opportunityId}
              href={`/opportunities/${match.opportunityId}`}
              className="block case-card-interactive p-5 group"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg text-ink group-hover:text-forest transition-colors leading-snug break-words">
                    {opp.title}
                  </p>
                  <p className="text-ink-soft text-sm mt-0.5">{opp.provider} · {opp.country}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`badge ${tier.color}`}>{tier.label}</span>
                  <span className="font-mono text-xs text-slate">{match.fitScore}/100</span>
                </div>
              </div>

              {match.urgency && (
                <p className="mt-2 font-mono text-xs text-brass">{match.urgency}</p>
              )}

              <p className="mt-3 text-sm text-ink-soft leading-relaxed">{match.reasoning}</p>

              {match.standoutFactor && match.standoutFactor !== "None — significant eligibility gap." && (
                <p className="mt-2 text-xs text-forest">
                  <span className="font-medium">Your edge: </span>
                  {match.standoutFactor}
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="badge bg-surface text-slate border border-rule">
                  {opp.type.replace(/_/g, " ")}
                </span>
                <span className="badge bg-surface text-slate border border-rule capitalize">
                  {opp.degreeLevel}
                </span>
                {opp.fundingCoverage && (
                  <span className="badge bg-surface text-slate border border-rule">
                    {opp.fundingCoverage}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-slate font-mono">
        Profile fit scores based on your CV as of{" "}
        {user.cvData?.parsedAt ? new Date(user.cvData.parsedAt).toLocaleDateString() : "upload date"}.
        A high fit score means you meet the criteria well — committees still make the final call.{" "}
        <Link href="/cv" className="text-forest underline">Update CV</Link> to improve accuracy.
      </p>
    </div>
  );
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"catalogue" | "for-you">("catalogue");

  const resetPage = useCallback(() => setPage(1), []);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type) params.set("type", type);
      // incubators/accelerators live on /grants — exclude when no specific type is selected
      else params.set("excludeType", "incubator");
      if (degreeLevel) params.set("degreeLevel", degreeLevel);
      if (country) params.set("country", country);
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      const data = await api.get<{ opportunities: Opportunity[]; pagination: Pagination }>(
        `/opportunities?${params.toString()}`,
        { auth: false }
      );
      setOpportunities(data.opportunities);
      setPagination(data.pagination);
    } catch (err: any) {
      setError(err.message || "Couldn't load opportunities right now.");
    } finally {
      setLoading(false);
    }
  }, [q, type, degreeLevel, country, page]);

  useEffect(() => {
    const timeout = setTimeout(fetchOpportunities, 300);
    return () => clearTimeout(timeout);
  }, [fetchOpportunities]);

  function handleFilterChange(setter: (v: string) => void) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setter(e.target.value);
      resetPage();
    };
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      {/* Hero — shown only to visitors, hidden once logged in */}
      {!authLoading && !user && (
        <div className="flex flex-col lg:flex-row lg:items-center gap-14 lg:gap-16">
          <div className="max-w-xl flex-shrink-0">
            <h1 className="font-display text-5xl sm:text-6xl text-ink leading-[1.05] tracking-tight">
              Study abroad.<br />
              <span style={{ color: "#2563EB" }}>Without the guesswork.</span>
            </h1>
            <p className="text-ink-soft mt-5 text-lg leading-relaxed">
              Scholarships and programs matched to your profile. Coaching that closes the gaps before you apply. The committee decides — we help you show up prepared.
            </p>
            <div className="mt-7 flex gap-3">
              <Link href="/register" className="btn-primary">Get started free</Link>
              <Link href="/cv" className="btn-secondary">Upload your CV</Link>
            </div>
            <p className="mt-5 text-xs text-slate font-mono">Free to start · No credit card required</p>
          </div>

          {/* Product preview */}
          <div className="hidden lg:block relative flex-1 min-h-[300px]">
            <div
              className="absolute rounded-3xl pointer-events-none"
              style={{
                inset: "-20px",
                background: "radial-gradient(ellipse at 60% 50%, rgba(37,99,235,0.08) 0%, transparent 70%)",
              }}
            />
            <div className="case-card p-5 absolute top-0 left-0 w-72">
              <p className="font-mono text-xs text-slate uppercase tracking-widest mb-3">Readiness Score</p>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
                  <svg viewBox="0 0 64 64" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#E2E8F0" strokeWidth="5.5" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#2563EB" strokeWidth="5.5"
                      strokeLinecap="round"
                      strokeDasharray={String(2 * Math.PI * 26)}
                      strokeDashoffset={String(2 * Math.PI * 26 * 0.27)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-xl leading-none" style={{ color: "#2563EB" }}>73</span>
                  </div>
                </div>
                <div>
                  <p className="font-display text-lg text-ink">On Track</p>
                  <p className="text-xs text-slate mt-0.5">Language score needed</p>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {[
                  { label: "Academic", pct: 80 },
                  { label: "Experience", pct: 64 },
                  { label: "Language", pct: 50 },
                ].map(({ label, pct }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-slate w-20 shrink-0 font-mono">{label}</span>
                    <div className="flex-1 h-1.5 bg-rule rounded-full overflow-hidden">
                      <div className="h-full bg-forest rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs font-mono text-slate w-7 text-right">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div
              className="case-card p-4 absolute w-60"
              style={{
                bottom: 0,
                right: 0,
                boxShadow: "0 4px 12px 0 rgba(0,0,0,0.08), 0 8px 24px 0 rgba(0,0,0,0.06)",
              }}
            >
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-slate">UK · Full funding</p>
                  <p className="text-sm font-medium text-ink leading-snug mt-0.5">Chevening Scholarship 2025</p>
                </div>
                <span className="badge bg-blue-50 text-forest border border-blue-200 shrink-0">Strong</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-rule rounded-full overflow-hidden">
                  <div className="h-full bg-forest rounded-full" style={{ width: "87%" }} />
                </div>
                <span className="font-mono text-xs text-forest shrink-0 w-8 text-right">87%</span>
              </div>
              <p className="text-xs text-ink-soft mt-2 leading-snug">
                Your profile fits the criteria well — now the preparation starts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Logged-in header */}
      {!authLoading && user && (
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl text-ink">
              {user.cvData ? "Find your next opportunity" : "Welcome, " + (user.fullName?.split(" ")[0] ?? "there")}
            </h1>
            {!user.cvData && (
              <p className="text-ink-soft text-sm mt-1">
                <Link href="/cv" className="text-forest underline">Upload your CV</Link> to unlock personalised matching and coaching.
              </p>
            )}
          </div>
          <Link href="/dashboard" className="text-sm text-slate hover:text-forest transition-colors font-mono">
            My applications →
          </Link>
        </div>
      )}

      {/* Segment control tab switcher */}
      <div className={!authLoading && user ? "mt-8" : "mt-14"}>
        <div
          className="inline-flex rounded-lg p-1 gap-1"
          style={{ background: "#EEF2FF" }}
        >
          <button
            onClick={() => setActiveTab("catalogue")}
            className="px-5 py-2 text-sm font-medium rounded-md transition-all"
            style={
              activeTab === "catalogue"
                ? { background: "#fff", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { background: "transparent", color: "#64748B" }
            }
          >
            Catalogue
          </button>
          <button
            onClick={() => setActiveTab("for-you")}
            className="px-5 py-2 text-sm font-medium rounded-md transition-all"
            style={
              activeTab === "for-you"
                ? { background: "#fff", color: "#0F172A", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }
                : { background: "transparent", color: "#64748B" }
            }
          >
            For You
          </button>
        </div>
      </div>

      {activeTab === "for-you" ? (
        <ForYouPanel />
      ) : (
        <>
          {/* Grants callout */}
          <Link
            href="/grants"
            className="mt-5 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 hover:bg-amber-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">💡</span>
              <div>
                <p className="text-sm font-medium text-brass">Looking for startup grants?</p>
                <p className="text-xs text-amber-700 mt-0.5">Browse grants for tech, Africa, innovation, inclusion, and talent — refreshed every 8 hours.</p>
              </div>
            </div>
            <span className="font-mono text-xs text-brass shrink-0">View Grants →</span>
          </Link>

          {/* Filter bar */}
          <div className="mt-4 flex flex-col md:flex-row gap-2.5">
            <input
              value={q}
              onChange={handleFilterChange(setQ)}
              placeholder="Search by title, provider, or keyword…"
              className="input flex-1"
            />
            <select
              value={type}
              onChange={handleFilterChange(setType)}
              className="input md:w-44"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <select
              value={degreeLevel}
              onChange={handleFilterChange(setDegreeLevel)}
              className="input md:w-36"
            >
              {DEGREE_LEVELS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
            <input
              value={country}
              onChange={handleFilterChange(setCountry)}
              placeholder="Country"
              className="input md:w-36"
            />
          </div>

          <div className="mt-8">
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="case-card p-5 animate-pulse h-44">
                    <div className="h-3 bg-rule rounded w-1/3 mb-4" />
                    <div className="h-5 bg-rule rounded w-4/5 mb-2" />
                    <div className="h-3 bg-rule rounded w-1/2 mb-4" />
                    <div className="h-3 bg-rule rounded w-full" />
                  </div>
                ))}
              </div>
            )}
            {error && <p className="text-alert text-sm">{error}</p>}
            {!loading && !error && opportunities.length === 0 && (
              <p className="text-slate text-sm">No opportunities match those filters. Try widening your search.</p>
            )}

            {pagination && !loading && (
              <p className="text-xs text-slate font-mono mb-5">
                {pagination.total} result{pagination.total !== 1 ? "s" : ""}
                {pagination.pages > 1 && ` — page ${pagination.page} of ${pagination.pages}`}
              </p>
            )}

            {!loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {opportunities.map((o) => (
                  <OpportunityCard key={o._id} opportunity={o} />
                ))}
              </div>
            )}

            {pagination && pagination.pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="btn-secondary text-sm px-4 py-2 disabled:opacity-30"
                >
                  ← Prev
                </button>

                {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === pagination.pages || Math.abs(p - page) <= 2)
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="text-slate font-mono text-sm px-1">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        disabled={loading}
                        className={`w-9 h-9 text-sm font-mono rounded-md transition-colors disabled:opacity-50 ${
                          page === p
                            ? "bg-forest text-white"
                            : "border border-rule text-ink-soft hover:border-forest hover:text-forest"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages || loading}
                  className="btn-secondary text-sm px-4 py-2 disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
