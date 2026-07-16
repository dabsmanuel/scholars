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
  { value: "study_program", label: "Study Programs" },
  { value: "immigration_pathway", label: "Immigration Pathways" },
  { value: "incubator", label: "Incubators" },
  { value: "fellowship", label: "Fellowships" },
];

const DEGREE_LEVELS = [
  { value: "", label: "Any level" },
  { value: "undergraduate", label: "Undergraduate" },
  { value: "masters", label: "Master's" },
  { value: "phd", label: "PhD" },
  { value: "postdoc", label: "Postdoc" },
  { value: "professional", label: "Professional" },
  { value: "none", label: "No degree requirement" },
];

const PAGE_SIZE = 20;

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const TIER_CONFIG = {
  strong: { label: "Strong fit", color: "text-forest border-forest bg-forest/5" },
  good: { label: "Good fit", color: "text-brass border-brass bg-brass/5" },
  moderate: { label: "Moderate fit", color: "text-slate border-slate bg-slate/5" },
  weak: { label: "Weak fit", color: "text-alert border-alert bg-alert/5" },
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
      <div className="mt-10 border border-rule p-8 max-w-lg">
        <p className="font-display text-xl text-ink">Sign in to see your matches</p>
        <p className="text-ink-soft mt-2 text-sm leading-relaxed">
          Create an account, upload your CV, and we'll rank the catalogue by how well each opportunity fits your actual background.
        </p>
        <div className="mt-5 flex gap-3">
          <Link href="/login" className="border border-forest text-forest px-4 py-2 text-sm hover:bg-forest hover:text-paper transition-colors">
            Sign in
          </Link>
          <Link href="/register" className="bg-forest text-paper px-4 py-2 text-sm hover:bg-forest-light transition-colors">
            Create account
          </Link>
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
      <div className="mt-10 border border-rule p-8 max-w-lg">
        <p className="font-display text-xl text-ink">Upload your CV to unlock matches</p>
        <p className="text-ink-soft mt-2 text-sm leading-relaxed">
          We'll read your actual background — education, experience, skills — and rank every opportunity in the catalogue against it. No generic suggestions.
        </p>
        <Link href="/cv" className="inline-block mt-5 bg-forest text-paper px-4 py-2 text-sm hover:bg-forest-light transition-colors">
          Upload CV →
        </Link>
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
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border border-rule p-5 animate-pulse">
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
      <div className="mt-10 border border-rule p-8 max-w-lg">
        <p className="font-display text-xl text-ink">No strong matches yet</p>
        <p className="text-ink-soft mt-2 text-sm leading-relaxed">
          We didn't find opportunities that clearly match your current profile. This improves as more opportunities are added to the catalogue.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-10">
      <p className="text-xs font-mono text-slate mb-6">
        {matches.length} match{matches.length !== 1 ? "es" : ""} ranked by how well they fit your CV —{" "}
        <button onClick={fetchRecommendations} className="text-forest underline">
          refresh
        </button>
      </p>

      <div className="space-y-4">
        {matches.map((match) => {
          const tier = TIER_CONFIG[match.fitTier] ?? TIER_CONFIG.moderate;
          const opp = match.opportunity;
          if (!opp) return null;

          return (
            <Link
              key={match.opportunityId}
              href={`/opportunities/${match.opportunityId}`}
              className="block border border-rule p-5 hover:border-forest transition-colors group"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-lg text-ink group-hover:text-forest transition-colors leading-snug break-words">
                    {opp.title}
                  </p>
                  <p className="text-ink-soft text-sm mt-0.5">{opp.provider} · {opp.country}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`font-mono text-xs border px-2 py-0.5 ${tier.color}`}>
                    {tier.label}
                  </span>
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
                <span className="font-mono text-xs bg-paper border border-rule px-2 py-0.5 text-slate capitalize">
                  {opp.type.replace("_", " ")}
                </span>
                <span className="font-mono text-xs bg-paper border border-rule px-2 py-0.5 text-slate capitalize">
                  {opp.degreeLevel}
                </span>
                {opp.fundingCoverage && (
                  <span className="font-mono text-xs bg-paper border border-rule px-2 py-0.5 text-slate">
                    {opp.fundingCoverage}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-slate font-mono">
        Scores are based on your CV data as of{" "}
        {user.cvData?.parsedAt ? new Date(user.cvData.parsedAt).toLocaleDateString() : "upload date"}.{" "}
        <Link href="/cv" className="text-forest underline">Update your CV</Link> to improve accuracy.
      </p>
    </div>
  );
}

export default function HomePage() {
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
    <div className="max-w-6xl mx-auto px-6 py-14">
      <div className="max-w-2xl">
        <p className="font-mono text-xs tracking-widest uppercase text-brass">The Catalogue</p>
        <h1 className="font-display text-4xl sm:text-5xl text-ink mt-3 leading-tight">
          Every case, argued <em className="italic">before</em> you apply.
        </h1>
        <p className="text-ink-soft mt-4 leading-relaxed">
          Scholarships, study programs, and pathways abroad — each broken down plainly, then matched
          against your own CV so you know exactly where you stand and what to write.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="mt-10 flex gap-0 border-b border-rule">
        <button
          onClick={() => setActiveTab("catalogue")}
          className={`px-5 py-2.5 text-sm font-mono transition-colors border-b-2 -mb-px ${
            activeTab === "catalogue"
              ? "border-forest text-forest"
              : "border-transparent text-slate hover:text-ink"
          }`}
        >
          Catalogue
        </button>
        <button
          onClick={() => setActiveTab("for-you")}
          className={`px-5 py-2.5 text-sm font-mono transition-colors border-b-2 -mb-px ${
            activeTab === "for-you"
              ? "border-forest text-forest"
              : "border-transparent text-slate hover:text-ink"
          }`}
        >
          For You
        </button>
      </div>

      {activeTab === "for-you" ? (
        <ForYouPanel />
      ) : (
        <>
          <div className="mt-6 border-y border-rule py-5 flex flex-col md:flex-row gap-3">
            <input
              value={q}
              onChange={handleFilterChange(setQ)}
              placeholder="Search by title, provider, or keyword…"
              className="flex-1 bg-transparent border border-rule px-4 py-2.5 text-sm focus:border-forest outline-none"
            />
            <select
              value={type}
              onChange={handleFilterChange(setType)}
              className="border border-rule px-3 py-2.5 text-sm bg-paper"
            >
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <select
              value={degreeLevel}
              onChange={handleFilterChange(setDegreeLevel)}
              className="border border-rule px-3 py-2.5 text-sm bg-paper"
            >
              {DEGREE_LEVELS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
            <input
              value={country}
              onChange={handleFilterChange(setCountry)}
              placeholder="Country"
              className="w-full md:w-40 bg-transparent border border-rule px-4 py-2.5 text-sm focus:border-forest outline-none"
            />
          </div>

          <div className="mt-10">
            {loading && <p className="text-slate font-mono text-sm">Loading the catalogue…</p>}
            {error && <p className="text-alert text-sm">{error}</p>}
            {!loading && !error && opportunities.length === 0 && (
              <p className="text-slate">No opportunities match those filters yet. Try widening your search.</p>
            )}

            {pagination && !loading && (
              <p className="text-xs text-slate font-mono mb-5">
                {pagination.total} result{pagination.total !== 1 ? "s" : ""}
                {pagination.pages > 1 && ` — page ${pagination.page} of ${pagination.pages}`}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {opportunities.map((o) => (
                <OpportunityCard key={o._id} opportunity={o} />
              ))}
            </div>

            {pagination && pagination.pages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="border border-rule px-4 py-2 text-sm font-mono text-ink-soft hover:border-forest hover:text-forest disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                        className={`w-9 h-9 text-sm font-mono border transition-colors disabled:opacity-50 ${
                          page === p
                            ? "border-forest bg-forest text-paper"
                            : "border-rule text-ink-soft hover:border-forest hover:text-forest"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages || loading}
                  className="border border-rule px-4 py-2 text-sm font-mono text-ink-soft hover:border-forest hover:text-forest disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
