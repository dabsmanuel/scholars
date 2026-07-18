"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Roadmap, UserProfile } from "@/lib/types";
import UpgradePrompt from "@/components/UpgradePrompt";

const DEGREE_LEVELS = ["Undergraduate", "Master's", "PhD", "Postdoc", "Professional", "Not sure yet"];
const COUNTRIES = [
  "United Kingdom", "Germany", "Canada", "Sweden", "Netherlands",
  "Australia", "United States", "France", "Japan", "China",
  "Norway", "Denmark", "Finland", "Switzerland", "Belgium",
];

const MONTH_YEARS: string[] = [];
(function buildOptions() {
  const now = new Date();
  for (let i = 3; i <= 30; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    MONTH_YEARS.push(d.toLocaleString("en-GB", { month: "long", year: "numeric" }));
  }
})();

export default function RoadmapPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<{
    targetCountries: string[];
    targetDegreeLevel: string;
    targetStartDate: string;
    annualBudgetUSD: string;
    ielts: string;
    toefl: string;
    gre: string;
  }>({
    targetCountries: [],
    targetDegreeLevel: "",
    targetStartDate: "",
    annualBudgetUSD: "",
    ielts: "",
    toefl: "",
    gre: "",
  });

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    if (user.roadmapCache) {
      setRoadmap(user.roadmapCache);
      setLoading(false);
    } else {
      api.get<{ roadmap: Roadmap | null }>("/profile/roadmap")
        .then(({ roadmap: r }) => {
          setRoadmap(r);
          setShowForm(!r);
        })
        .catch(() => setShowForm(true))
        .finally(() => setLoading(false));
    }
  }, [user]);

  function toggleCountry(c: string) {
    setForm((f) => ({
      ...f,
      targetCountries: f.targetCountries.includes(c)
        ? f.targetCountries.filter((x) => x !== c)
        : [...f.targetCountries, c],
    }));
  }

  async function saveAndGenerate() {
    if (!form.targetCountries.length) {
      setError("Select at least one target country.");
      return;
    }
    setGenerating(true);
    setError(null);
    try {
      const profile: Partial<UserProfile> = {
        targetCountries: form.targetCountries,
        targetDegreeLevel: form.targetDegreeLevel || undefined,
        targetStartDate: form.targetStartDate || undefined,
        annualBudgetUSD: form.annualBudgetUSD ? Number(form.annualBudgetUSD) : undefined,
        testScores: {
          ielts: form.ielts ? Number(form.ielts) : undefined,
          toefl: form.toefl ? Number(form.toefl) : undefined,
          gre: form.gre ? Number(form.gre) : undefined,
        },
      };

      await api.patch("/profile/questionnaire", profile);
      const { roadmap: r } = await api.post<{ roadmap: Roadmap }>("/profile/roadmap");
      setRoadmap(r);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't generate roadmap.");
    } finally {
      setGenerating(false);
    }
  }

  if (authLoading || loading) {
    return <p className="max-w-3xl mx-auto px-6 py-20 text-slate font-mono text-sm">Loading your roadmap…</p>;
  }
  if (!user) return null;

  const isPro = user.subscription?.plan === "pro" &&
    (user.subscription?.status === "active" || user.subscription?.status === "trialing");

  if (!isPro) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl text-ink">My Roadmap</h1>
        <p className="text-ink-soft mt-2 text-lg">Your week-by-week plan to get scholarship-ready.</p>
        <UpgradePrompt feature="roadmap" />
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-14">
        <h1 className="font-display text-4xl text-ink mb-3">Build your plan</h1>
        <p className="text-ink-soft mb-10">
          Answer a few questions and we'll generate a week-by-week scholarship roadmap built around your goals, timeline, and target countries.
        </p>

        {error && <p className="text-alert text-sm mb-4">{error}</p>}

        <div className="space-y-8">
          <div>
            <label className="block text-sm font-medium text-ink mb-3">
              Which countries are you targeting? <span className="text-slate font-normal">(select all that apply)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {COUNTRIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCountry(c)}
                  className={`text-sm px-3 py-1.5 border rounded-md transition-colors ${
                    form.targetCountries.includes(c)
                      ? "bg-forest text-white border-forest"
                      : "border-rule text-ink-soft hover:border-forest hover:text-forest"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Target degree level</label>
              <select
                value={form.targetDegreeLevel}
                onChange={(e) => setForm((f) => ({ ...f, targetDegreeLevel: e.target.value }))}
                className="input"
              >
                <option value="">Select…</option>
                {DEGREE_LEVELS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Target start date</label>
              <select
                value={form.targetStartDate}
                onChange={(e) => setForm((f) => ({ ...f, targetStartDate: e.target.value }))}
                className="input"
              >
                <option value="">Select…</option>
                {MONTH_YEARS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Annual budget (USD)</label>
              <input
                type="number"
                value={form.annualBudgetUSD}
                onChange={(e) => setForm((f) => ({ ...f, annualBudgetUSD: e.target.value }))}
                placeholder="e.g. 15000"
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-3">Language test scores <span className="text-slate font-normal">(leave blank if not taken)</span></label>
            <div className="grid grid-cols-3 gap-4">
              {[
                { key: "ielts", label: "IELTS", placeholder: "e.g. 7.0" },
                { key: "toefl", label: "TOEFL iBT", placeholder: "e.g. 100" },
                { key: "gre", label: "GRE", placeholder: "e.g. 320" },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs text-slate font-mono mb-1">{label}</label>
                  <input
                    type="number"
                    value={form[key as keyof typeof form] as string}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="input"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={saveAndGenerate}
            disabled={generating}
            className="btn-primary w-full"
          >
            {generating ? "Building your roadmap…" : "Generate my roadmap"}
          </button>
        </div>
      </div>
    );
  }

  if (!roadmap) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-14">
      <div className="flex items-start justify-between mb-2">
        <p className="font-mono text-xs tracking-widest uppercase text-slate">My Roadmap</p>
        <button
          onClick={() => setShowForm(true)}
          className="text-xs text-forest font-mono hover:underline"
        >
          Update goals →
        </button>
      </div>
      <h1 className="font-display text-4xl text-ink mb-4">{roadmap.title}</h1>
      <p className="text-ink-soft leading-relaxed mb-12">{roadmap.overview}</p>

      <div className="space-y-0">
        {roadmap.weeks.map((week, i) => (
          <div key={week.week} className="flex gap-5">
            {/* Timeline spine */}
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-forest text-white flex items-center justify-center font-mono text-xs shrink-0 z-10">
                {week.week}
              </div>
              {i < roadmap.weeks.length - 1 && (
                <div className="w-0.5 flex-1 bg-rule my-1" />
              )}
            </div>

            {/* Content */}
            <div className={`pb-8 flex-1 ${i === roadmap.weeks.length - 1 ? "" : ""}`}>
              <p className="font-display text-lg text-ink">{week.label}</p>
              {week.milestone && (
                <p className="text-xs font-mono text-brass mt-0.5 mb-2">
                  Milestone: {week.milestone}
                </p>
              )}
              <ul className="mt-2 space-y-1.5">
                {week.tasks.map((task, j) => (
                  <li key={j} className="text-sm text-ink-soft flex gap-2">
                    <span className="text-forest shrink-0 mt-0.5">✓</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate font-mono mt-8">
        Generated {new Date(roadmap.generatedAt).toLocaleDateString()} · Based on your profile and CV
      </p>
    </div>
  );
}
