"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Opportunity } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  scholarship: "Scholarship",
  study_program: "Study Program",
  immigration_pathway: "Immigration Pathway",
  incubator: "Incubator",
  fellowship: "Fellowship",
};

export default function OpportunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const router = useRouter();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<{ opportunity: Opportunity }>(`/opportunities/${id}`, { auth: false })
      .then((data) => setOpportunity(data.opportunity))
      .catch((err) => setError(err.message || "Couldn't load this opportunity."))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (user) {
      setSaved(user.savedOpportunities.some((s) => s.opportunity === id));
    }
  }, [user, id]);

  async function handleGenerateBreakdown() {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.post<{ opportunity: Opportunity }>(`/opportunities/${id}/breakdown`, undefined, {
        auth: false,
      });
      setOpportunity(data.opportunity);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate the breakdown right now.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    if (!user) {
      router.push("/login");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/opportunities/${id}/save`);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this opportunity.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="max-w-4xl mx-auto px-6 py-20 text-slate font-mono text-sm">Loading case file…</p>;
  if (error && !opportunity) return <p className="max-w-4xl mx-auto px-6 py-20 text-alert">{error}</p>;
  if (!opportunity) return null;

  const hasBreakdown = Boolean(opportunity.strongApplicantProfile);

  return (
    <div className="max-w-4xl mx-auto px-6 py-14">
      <div className="flex flex-wrap items-center gap-3">
        <span className="stamp text-forest border-forest">{TYPE_LABELS[opportunity.type]}</span>
        <span className="text-xs text-slate font-mono">{opportunity.country}</span>
        {opportunity.deadline && (
          <span className="text-xs text-slate font-mono">
            Deadline: {new Date(opportunity.deadline).toLocaleDateString()}
          </span>
        )}
      </div>

      <h1 className="font-display text-4xl text-ink mt-4 leading-tight">{opportunity.title}</h1>
      <p className="text-ink-soft mt-1">{opportunity.provider}</p>

      <div className="flex flex-wrap gap-3 mt-6">
        <button
          onClick={handleSave}
          disabled={saved || saving}
          className="border border-forest text-forest px-5 py-2.5 text-sm hover:bg-forest hover:text-paper transition-colors disabled:opacity-60"
        >
          {saved ? "Saved to your case files" : saving ? "Saving…" : "Save to case files"}
        </button>
        <Link
          href={`/applications/${opportunity._id}`}
          className="bg-forest text-paper px-5 py-2.5 text-sm hover:bg-forest-light transition-colors"
        >
          Get personalized coaching →
        </Link>
        <a
          href={opportunity.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-ink-soft underline self-center"
        >
          Official page
        </a>
      </div>

      <div className="mt-10 space-y-8">
        <section>
          <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">Objectives</h2>
          <p className="text-ink-soft mt-3 leading-relaxed">{opportunity.objectives}</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">Eligibility, plainly</h2>
          <p className="text-ink-soft mt-3 leading-relaxed">{opportunity.eligibilitySummary}</p>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">Requirements</h2>
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            {opportunity.requirements.map((r, i) => (
              <div key={i} className="case-card p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-ink text-sm">{r.label}</p>
                  <span className={`text-xs font-mono ${r.isHard ? "text-alert" : "text-brass"}`}>
                    {r.isHard ? "HARD" : "SOFT"}
                  </span>
                </div>
                {r.detail && <p className="text-sm text-slate mt-1">{r.detail}</p>}
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">What a strong applicant looks like</h2>
          {hasBreakdown ? (
            <p className="text-ink-soft mt-3 leading-relaxed">{opportunity.strongApplicantProfile}</p>
          ) : (
            <div className="mt-3">
              <p className="text-slate text-sm">
                A detailed breakdown hasn't been generated for this opportunity yet.
              </p>
              <button
                onClick={handleGenerateBreakdown}
                disabled={generating}
                className="mt-3 border border-brass text-brass px-4 py-2 text-sm hover:bg-brass hover:text-paper transition-colors disabled:opacity-60"
              >
                {generating ? "Generating…" : "Generate breakdown"}
              </button>
            </div>
          )}
        </section>
      </div>

      {error && <p className="text-alert text-sm mt-6">{error}</p>}
    </div>
  );
}
