"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Opportunity } from "@/lib/types";

function detectScamFlags(opp: Opportunity): string[] {
  const flags: string[] = [];
  const text = `${opp.title} ${opp.objectives} ${opp.eligibilitySummary}`.toLowerCase();

  if (!opp.officialUrl || opp.officialUrl === "https://example.com") {
    flags.push("No verified official URL provided — confirm this scholarship exists independently before applying.");
  }
  if (opp.requirements.some((r) => r.category === "financial" && /fee|pay|payment|deposit/i.test(r.label + " " + (r.detail || "")))) {
    flags.push("An application fee is mentioned. Legitimate scholarships do not charge fees to apply.");
  }
  if (/guaranteed|100% success|no gpa|no ielts required|everyone qualifies/i.test(text)) {
    flags.push("Language suggesting guaranteed admission or zero requirements is a common fraud signal.");
  }
  if (opp.requirements.length === 0 && opp.eligibilitySummary.length < 80) {
    flags.push("Very limited eligibility information. Legitimate scholarships publish clear, detailed criteria.");
  }
  return flags;
}

const TYPE_LABELS: Record<string, string> = {
  scholarship: "Scholarship",
  study_program: "Study Program",
  immigration_pathway: "Immigration Pathway",
  incubator: "Incubator",
  fellowship: "Fellowship",
};

export default function OpportunityDetail({ initial }: { initial: Opportunity }) {
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [opportunity, setOpportunity] = useState<Opportunity>(initial);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(
    () => user?.savedOpportunities.some((s) => s.opportunity === initial._id) ?? false
  );
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateBreakdown() {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.post<{ opportunity: Opportunity }>(
        `/opportunities/${opportunity._id}/breakdown`,
        undefined,
        { auth: false }
      );
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
      await api.post(`/opportunities/${opportunity._id}/save`);
      setSaved(true);
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save this opportunity.");
    } finally {
      setSaving(false);
    }
  }

  const hasBreakdown = Boolean(opportunity.strongApplicantProfile);
  const scamFlags = detectScamFlags(opportunity);

  return (
    <div className="max-w-5xl mx-auto px-6 py-14">
      {scamFlags.length > 0 && (
        <div className="mb-8 border border-alert bg-alert/5 p-4" style={{ borderRadius: "6px" }}>
          <p className="font-mono text-xs tracking-widest uppercase text-alert mb-2">⚠ Verify before applying</p>
          <ul className="space-y-1.5">
            {scamFlags.map((flag, i) => (
              <li key={i} className="text-sm text-ink-soft flex gap-2">
                <span className="text-alert shrink-0">→</span> {flag}
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate mt-3">
            Always verify through official government or university websites. If something feels wrong,{" "}
            <Link href="/mentor" className="text-forest underline">ask your mentor</Link>.
          </p>
        </div>
      )}

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
        <Link
          href={`/interview?opportunity=${opportunity._id}`}
          className="border border-rule text-ink-soft px-5 py-2.5 text-sm hover:border-forest hover:text-forest transition-colors"
        >
          Practice interview
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
          <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">
            What a strong applicant looks like
          </h2>
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
