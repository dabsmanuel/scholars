"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Application, Opportunity } from "@/lib/types";

export default function ApplicationCoachingPage() {
  const { opportunityId } = useParams<{ opportunityId: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [application, setApplication] = useState<Application | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [essayTitle, setEssayTitle] = useState("");
  const [essayContent, setEssayContent] = useState("");
  const [submittingEssay, setSubmittingEssay] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const oppData = await api.get<{ opportunity: Opportunity }>(`/opportunities/${opportunityId}`, {
          auth: false,
        });
        setOpportunity(oppData.opportunity);

        try {
          const appData = await api.get<{ application: Application }>(`/applications/${opportunityId}`);
          setApplication(appData.application);
        } catch (err) {
          if (err instanceof ApiError && err.status !== 404) throw err;
        }
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't load this case file.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user, opportunityId]);

  async function handleGenerateCoaching(force = false) {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.post<{ application: Application }>(
        `/applications/${opportunityId}/coaching${force ? "?force=true" : ""}`
      );
      setApplication(data.application);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Couldn't generate coaching right now. Please try again shortly."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmitEssay(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingEssay(true);
    setError(null);
    try {
      const data = await api.post<{ application: Application }>(`/applications/${opportunityId}/essays`, {
        title: essayTitle,
        content: essayContent,
      });
      setApplication(data.application);
      setEssayTitle("");
      setEssayContent("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't review that draft right now.");
    } finally {
      setSubmittingEssay(false);
    }
  }

  if (authLoading || loading) {
    return <p className="max-w-4xl mx-auto px-6 py-20 text-slate font-mono text-sm">Loading case file…</p>;
  }

  if (!opportunity) return <p className="max-w-4xl mx-auto px-6 py-20 text-alert">{error}</p>;

  const needsCv = error?.toLowerCase().includes("upload your cv");
  const coaching = application?.coaching;

  return (
    <div className="max-w-4xl mx-auto px-6 py-14">
      <p className="font-mono text-xs tracking-widest uppercase text-brass">Case File</p>
      <h1 className="font-display text-4xl text-ink mt-2 leading-tight">{opportunity.title}</h1>
      <p className="text-ink-soft mt-1">{opportunity.provider}</p>

      {needsCv && (
        <div className="mt-6 case-card p-5">
          <p className="text-ink-soft">You'll need a CV on file before we can build your coaching.</p>
          <a href="/cv" className="inline-block mt-3 text-forest underline text-sm">
            Upload your CV →
          </a>
        </div>
      )}

      {!coaching && !needsCv && (
        <div className="mt-8 case-card p-6">
          <h2 className="font-display text-2xl text-ink">Build your strategy</h2>
          <p className="text-ink-soft mt-2 leading-relaxed">
            We'll weigh your CV against this opportunity's actual requirements — objectives, alignment,
            essay angle, honest gaps, a requirement-by-requirement breakdown, and a working timeline.
          </p>
          <button
            onClick={() => handleGenerateCoaching(false)}
            disabled={generating}
            className="mt-4 bg-forest text-paper px-5 py-2.5 text-sm hover:bg-forest-light transition-colors disabled:opacity-60"
          >
            {generating ? "Building your case…" : "Generate my coaching"}
          </button>
        </div>
      )}

      {coaching && (
        <div className="mt-10 space-y-8">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate font-mono">
              Generated {new Date(coaching.generatedAt).toLocaleString()}
            </p>
            <button
              onClick={() => handleGenerateCoaching(true)}
              disabled={generating}
              className="text-xs text-forest underline disabled:opacity-60"
            >
              {generating ? "Regenerating…" : "Regenerate"}
            </button>
          </div>

          <section>
            <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">What they're actually seeking</h2>
            <p className="text-ink-soft mt-3 leading-relaxed">{coaching.scholarshipObjectives}</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">Your background alignment</h2>
            <p className="text-ink-soft mt-3 leading-relaxed whitespace-pre-line">{coaching.backgroundAlignment}</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">Essay strategy</h2>
            <p className="text-ink-soft mt-3 leading-relaxed whitespace-pre-line">{coaching.essayStrategy}</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">Weaknesses, and how to handle them</h2>
            <div className="mt-3 space-y-3">
              {coaching.weaknesses.map((w, i) => (
                <div key={i} className="case-card p-4">
                  <p className="text-ink font-medium text-sm">{w.gap}</p>
                  <p className="text-ink-soft text-sm mt-1.5">
                    <span className="text-forest font-medium">Mitigation: </span>
                    {w.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">Requirement by requirement</h2>
            <div className="mt-3 space-y-3">
              {coaching.requirementBreakdown.map((r, i) => (
                <div key={i} className="case-card p-4">
                  <p className="text-ink font-medium text-sm">{r.requirementLabel}</p>
                  <p className="text-ink-soft text-sm mt-1.5">{r.guidance}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">Timeline</h2>
            <div className="mt-3 space-y-2">
              {coaching.timeline.map((t, i) => (
                <div key={i} className="flex gap-4 border-b border-rule pb-2 last:border-0">
                  <span className="font-mono text-xs text-brass whitespace-nowrap pt-0.5">
                    {t.targetDate || `Step ${i + 1}`}
                  </span>
                  <div>
                    <p className="text-ink text-sm font-medium">{t.milestone}</p>
                    <p className="text-slate text-sm">{t.deliverable}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">Application walkthrough</h2>
            <p className="text-ink-soft mt-3 leading-relaxed whitespace-pre-line">{coaching.applicationGuide}</p>
          </section>

          <section>
            <h2 className="font-display text-2xl text-ink border-b border-rule pb-2">Essay review</h2>
            <p className="text-ink-soft mt-3">
              Paste a draft of your personal statement or essay and get specific, actionable feedback
              against this opportunity's requirements and your own CV.
            </p>

            <form onSubmit={handleSubmitEssay} className="mt-4 space-y-3">
              <input
                required
                value={essayTitle}
                onChange={(e) => setEssayTitle(e.target.value)}
                placeholder="Draft title, e.g. 'Personal Statement — v1'"
                className="w-full border border-rule px-4 py-2.5 bg-transparent focus:border-forest outline-none text-sm"
              />
              <textarea
                required
                value={essayContent}
                onChange={(e) => setEssayContent(e.target.value)}
                rows={10}
                placeholder="Paste your draft here…"
                className="w-full border border-rule px-4 py-3 bg-transparent focus:border-forest outline-none text-sm leading-relaxed"
              />
              <button
                type="submit"
                disabled={submittingEssay}
                className="bg-forest text-paper px-5 py-2.5 text-sm hover:bg-forest-light transition-colors disabled:opacity-60"
              >
                {submittingEssay ? "Reviewing your draft…" : "Submit for review"}
              </button>
            </form>

            {application && application.essayDrafts.length > 0 && (
              <div className="mt-8 space-y-6">
                {[...application.essayDrafts].reverse().map((draft) => (
                  <div key={draft._id} className="case-card p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-lg text-ink">{draft.title}</p>
                      <span className="text-xs font-mono text-slate">v{draft.version}</span>
                    </div>
                    {draft.feedback && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-xs font-mono uppercase text-brass">Overall</p>
                          <p className="text-ink-soft text-sm mt-1">{draft.feedback.overallAssessment}</p>
                        </div>
                        {draft.feedback.strengths.length > 0 && (
                          <div>
                            <p className="text-xs font-mono uppercase text-forest">Working well</p>
                            <ul className="list-disc list-inside text-sm text-ink-soft mt-1 space-y-1">
                              {draft.feedback.strengths.map((s, i) => (
                                <li key={i}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {draft.feedback.issues.length > 0 && (
                          <div>
                            <p className="text-xs font-mono uppercase text-alert">To fix</p>
                            <div className="mt-1 space-y-2">
                              {draft.feedback.issues.map((issue, i) => (
                                <div key={i} className="border-l-2 border-alert pl-3">
                                  <p className="text-xs text-slate">{issue.location}</p>
                                  <p className="text-sm text-ink-soft">{issue.problem}</p>
                                  <p className="text-sm text-forest mt-0.5">→ {issue.suggestion}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-mono uppercase text-brass">Authenticity</p>
                          <p className="text-ink-soft text-sm mt-1">{draft.feedback.authenticityNotes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {error && !needsCv && <p className="text-alert text-sm mt-6">{error}</p>}
    </div>
  );
}
