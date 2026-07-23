"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Grant, GrantTag, GrantsResponse } from "@/lib/types";

const TAG_META: Record<GrantTag, { label: string; color: string }> = {
  africa:     { label: "Africa",      color: "#D97706" },
  technology: { label: "Technology",  color: "#0D6EFD" },
  innovation: { label: "Innovation",  color: "#6F42C1" },
  inclusion:  { label: "Inclusion",   color: "#E91E8C" },
  talent:     { label: "Talent",      color: "#20C997" },
  climate:    { label: "Climate",     color: "#2D9E4E" },
  health:     { label: "Health",      color: "#DC3545" },
  education:  { label: "Education",   color: "#0DCAF0" },
  youth:      { label: "Youth",       color: "#FD7E14" },
};

const ALL_TAGS = Object.keys(TAG_META) as GrantTag[];

function TagChip({ tag, active, onClick }: { tag: GrantTag; active: boolean; onClick: () => void }) {
  const { label, color } = TAG_META[tag];
  return (
    <button
      onClick={onClick}
      style={
        active
          ? { backgroundColor: color, borderColor: color, color: "#fff" }
          : { borderColor: "#E2E8F0", color: "#64748B" }
      }
      className="stamp text-xs transition-all hover:opacity-80"
    >
      {label}
    </button>
  );
}

function GrantTagPill({ tag }: { tag: GrantTag }) {
  const { label, color } = TAG_META[tag] ?? { label: tag, color: "#64748B" };
  return (
    <span
      className="font-mono text-xs px-2 py-0.5 rounded-full border"
      style={{ color, borderColor: color, backgroundColor: `${color}15` }}
    >
      {label}
    </span>
  );
}

function GrantCard({ grant }: { grant: Grant }) {
  const deadlineDate = grant.deadline ? new Date(grant.deadline) : null;
  const isPast = deadlineDate ? deadlineDate < new Date() : false;
  const daysLeft = deadlineDate
    ? Math.ceil((deadlineDate.getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="case-card p-5 flex flex-col gap-3 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <Link
            href={`/grants/${grant._id}`}
            className="font-display text-base text-ink hover:text-forest transition-colors line-clamp-2 leading-snug"
          >
            {grant.title}
          </Link>
          <p className="text-xs text-slate mt-0.5">{grant.provider}</p>
        </div>
        {grant.amount && (
          <span className="shrink-0 font-mono text-xs bg-amber-50 text-brass border border-amber-200 px-2 py-1 rounded-lg whitespace-nowrap">
            {grant.amount}
          </span>
        )}
      </div>

      <p className="text-sm text-ink-soft leading-relaxed line-clamp-3">{grant.description}</p>

      <div className="flex flex-wrap gap-1.5">
        {grant.tags.map((t) => (
          <GrantTagPill key={t} tag={t} />
        ))}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-rule">
        <div className="flex items-center gap-3">
          {deadlineDate && !isPast && daysLeft !== null && (
            <span
              className="font-mono text-xs"
              style={{ color: daysLeft <= 14 ? "#DC3545" : daysLeft <= 30 ? "#D97706" : "#64748B" }}
            >
              {daysLeft <= 0
                ? "Closes today"
                : daysLeft === 1
                ? "1 day left"
                : `${daysLeft} days left`}
            </span>
          )}
          {isPast && (
            <span className="font-mono text-xs text-slate line-through">
              {deadlineDate!.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {deadlineDate && !isPast && (
            <span className="text-xs text-slate">
              {deadlineDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/grants/${grant._id}`}
            className="font-mono text-xs text-ink-soft hover:text-ink transition-colors"
          >
            Read more →
          </Link>
          <a
            href={grant.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-forest hover:underline flex items-center gap-1"
          >
            Apply
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 8L8 2M8 2H4M8 2V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="case-card p-5 flex flex-col gap-3 animate-pulse">
      <div className="h-4 bg-surface rounded w-3/4" />
      <div className="h-3 bg-surface rounded w-1/3" />
      <div className="h-3 bg-surface rounded w-full" />
      <div className="h-3 bg-surface rounded w-5/6" />
      <div className="flex gap-2">
        <div className="h-5 bg-surface rounded-full w-16" />
        <div className="h-5 bg-surface rounded-full w-20" />
      </div>
    </div>
  );
}

export default function GrantsPage() {
  const [grants, setGrants] = useState<Grant[]>([]);
  const [total, setTotal] = useState(0);
  const [lastScrapedAt, setLastScrapedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<GrantTag | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [activeTag, debouncedSearch]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "24" });
      if (activeTag) params.set("tag", activeTag);
      if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());

      const data = await api.get<GrantsResponse>(`/grants?${params}`, { auth: false });
      setGrants(data.grants);
      setTotal(data.total);
      setPages(data.pages);
      setLastScrapedAt(data.lastScrapedAt);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load grants. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [activeTag, debouncedSearch, page]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleTag(tag: GrantTag) {
    setActiveTag((t) => (t === tag ? null : tag));
  }

  const timeSince = lastScrapedAt
    ? (() => {
        const mins = Math.floor((Date.now() - new Date(lastScrapedAt).getTime()) / 60000);
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
      })()
    : null;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <p className="font-mono text-xs tracking-widest uppercase text-brass mb-2">Live listings</p>
        <h1 className="font-display text-3xl sm:text-4xl text-ink mb-3">Startup Grants</h1>
        <p className="text-ink-soft text-base max-w-2xl leading-relaxed">
          Grants and funding opportunities for startups working in technology, inclusion, innovation,
          talent development, and African markets — refreshed automatically every 8 hours.
        </p>
        {timeSince && (
          <p className="text-xs text-slate mt-2 font-mono">Last refreshed {timeSince}</p>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
        >
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search grants by keyword..."
          className="w-full pl-10 pr-4 py-3 border border-rule rounded-xl bg-white text-sm text-ink placeholder:text-slate focus:outline-none focus:ring-2 focus:ring-forest/30 transition"
        />
      </div>

      {/* Tag filters */}
      <div className="flex flex-wrap gap-2 mb-7">
        {ALL_TAGS.map((tag) => (
          <TagChip
            key={tag}
            tag={tag}
            active={activeTag === tag}
            onClick={() => toggleTag(tag)}
          />
        ))}
        {activeTag && (
          <button
            onClick={() => setActiveTag(null)}
            className="stamp text-xs text-slate border-rule hover:bg-surface transition-colors"
          >
            Clear ×
          </button>
        )}
      </div>

      {/* Results count */}
      {!loading && !error && (
        <p className="text-xs text-slate font-mono mb-4">
          {total === 0 ? "No grants found" : `${total} open grant${total !== 1 ? "s" : ""}`}
          {activeTag ? ` tagged "${TAG_META[activeTag].label}"` : ""}
          {debouncedSearch ? ` matching "${debouncedSearch}"` : ""}
        </p>
      )}

      {/* Error */}
      {error && (
        <div className="case-card p-6 text-center">
          <p className="text-alert text-sm mb-3">{error}</p>
          <button onClick={load} className="btn-primary text-sm">
            Try again
          </button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : !error && grants.length === 0 ? (
        <div className="case-card p-10 text-center">
          <p className="font-display text-xl text-ink mb-2">No grants found</p>
          <p className="text-ink-soft text-sm">
            {activeTag || debouncedSearch
              ? "Try removing filters or searching with different keywords."
              : "Grant listings are updated automatically every 8 hours. Check back soon."}
          </p>
          {(activeTag || debouncedSearch) && (
            <button
              onClick={() => { setActiveTag(null); setSearch(""); }}
              className="btn-primary text-sm mt-4"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {grants.map((g) => (
            <GrantCard key={g._id} grant={g} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && !loading && !error && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="stamp text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="font-mono text-xs text-slate">
            Page {page} of {pages}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="stamp text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}

      {grants.length > 0 && !loading && (
        <p className="text-xs text-slate/60 text-center mt-10 font-mono">
          Aggregated from OpportunityDesk, FundsForNGOs, OpportunitiesForAfricans, Youthop.
          Passage does not endorse or verify individual listings.
        </p>
      )}
    </main>
  );
}
