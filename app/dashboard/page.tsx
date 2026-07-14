"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Opportunity, SavedOpportunity } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  interested: "Interested",
  in_progress: "In progress",
  submitted: "Submitted",
  awarded: "Awarded",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export default function DashboardPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [details, setDetails] = useState<Record<string, Opportunity>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    async function loadDetails() {
      try {
        const entries = await Promise.all(
          user!.savedOpportunities.map((s) =>
            api.get<{ opportunity: Opportunity }>(`/opportunities/${s.opportunity}`, { auth: false })
          )
        );
        const map: Record<string, Opportunity> = {};
        entries.forEach((e) => {
          map[e.opportunity._id] = e.opportunity;
        });
        setDetails(map);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't load your saved opportunities.");
      } finally {
        setLoading(false);
      }
    }

    if (user.savedOpportunities.length > 0) {
      loadDetails();
    } else {
      setLoading(false);
    }
  }, [user]);

  async function updateStatus(opportunityId: string, status: string) {
    try {
      await api.patch(`/opportunities/${opportunityId}/save`, { status });
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update that status.");
    }
  }

  async function removeSaved(opportunityId: string) {
    try {
      await api.delete(`/opportunities/${opportunityId}/save`);
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't remove that opportunity.");
    }
  }

  if (authLoading || loading) {
    return <p className="max-w-4xl mx-auto px-6 py-20 text-slate font-mono text-sm">Loading your case files…</p>;
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 py-14">
      <p className="font-mono text-xs tracking-widest uppercase text-brass">Your Desk</p>
      <h1 className="font-display text-4xl text-ink mt-2">Case files</h1>
      <p className="text-ink-soft mt-3">
        Everything you're tracking, with deadlines and progress in one place.
      </p>

      {error && <p className="text-alert text-sm mt-4">{error}</p>}

      {user.savedOpportunities.length === 0 ? (
        <div className="mt-10 case-card p-8 text-center">
          <p className="text-ink-soft">You haven't saved any opportunities yet.</p>
          <Link href="/" className="inline-block mt-3 text-forest underline text-sm">
            Browse the catalogue →
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {user.savedOpportunities.map((s: SavedOpportunity) => {
            const opp = details[s.opportunity];
            return (
              <div key={s.opportunity} className="case-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1">
                  <Link href={`/opportunities/${s.opportunity}`} className="font-display text-xl text-ink hover:text-forest">
                    {opp?.title || "Loading…"}
                  </Link>
                  <p className="text-sm text-slate mt-0.5">{opp?.provider}</p>
                  {opp?.deadline && (
                    <p className="font-mono text-xs text-brass mt-1">
                      Deadline: {new Date(opp.deadline).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={s.status}
                    onChange={(e) => updateStatus(s.opportunity, e.target.value)}
                    className="border border-rule px-3 py-1.5 text-sm bg-paper"
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <Link
                    href={`/applications/${s.opportunity}`}
                    className="text-sm text-forest underline whitespace-nowrap"
                  >
                    Open coaching
                  </Link>
                  <button
                    onClick={() => removeSaved(s.opportunity)}
                    className="text-sm text-alert whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
