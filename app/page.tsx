"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Opportunity } from "@/lib/types";
import OpportunityCard from "@/components/OpportunityCard";

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

export default function HomePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [degreeLevel, setDegreeLevel] = useState("");
  const [country, setCountry] = useState("");

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (type) params.set("type", type);
      if (degreeLevel) params.set("degreeLevel", degreeLevel);
      if (country) params.set("country", country);

      const data = await api.get<{ opportunities: Opportunity[] }>(
        `/opportunities?${params.toString()}`,
        { auth: false }
      );
      setOpportunities(data.opportunities);
    } catch (err: any) {
      setError(err.message || "Couldn't load opportunities right now.");
    } finally {
      setLoading(false);
    }
  }, [q, type, degreeLevel, country]);

  useEffect(() => {
    const timeout = setTimeout(fetchOpportunities, 300);
    return () => clearTimeout(timeout);
  }, [fetchOpportunities]);

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

      <div className="mt-10 border-y border-rule py-5 flex flex-col md:flex-row gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, provider, or keyword…"
          className="flex-1 bg-transparent border border-rule px-4 py-2.5 text-sm focus:border-forest outline-none"
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
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
          onChange={(e) => setDegreeLevel(e.target.value)}
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
          onChange={(e) => setCountry(e.target.value)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {opportunities.map((o) => (
            <OpportunityCard key={o._id} opportunity={o} />
          ))}
        </div>
      </div>
    </div>
  );
}
