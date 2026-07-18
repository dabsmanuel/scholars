import Link from "next/link";
import { Opportunity } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  scholarship: "bg-blue-50 text-forest border border-blue-200",
  fellowship: "bg-violet-50 text-violet-700 border border-violet-200",
  study_program: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  immigration_pathway: "bg-amber-50 text-brass border border-amber-200",
  incubator: "bg-orange-50 text-orange-700 border border-orange-200",
};

const TYPE_LABELS: Record<string, string> = {
  scholarship: "Scholarship",
  study_program: "Study Program",
  immigration_pathway: "Immigration",
  incubator: "Incubator",
  fellowship: "Fellowship",
};

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  const days = daysUntil(opportunity.deadline);
  const urgent = days !== null && days <= 14 && days >= 0;
  const soon = days !== null && days <= 30 && days > 14;
  const closed = days !== null && days < 0;

  const deadlineClass = closed
    ? "text-slate"
    : urgent
    ? "text-alert font-semibold"
    : soon
    ? "text-brass"
    : "text-ink-soft";

  const typeColor = TYPE_COLORS[opportunity.type] ?? "bg-slate-50 text-slate border border-slate-200";

  return (
    <Link href={`/opportunities/${opportunity._id}`} className="block h-full">
      <article className="case-card-interactive p-5 h-full flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className={`badge ${typeColor}`}>
            {TYPE_LABELS[opportunity.type] ?? opportunity.type}
          </span>
          {opportunity.deadline && (
            <span className={`font-mono text-xs whitespace-nowrap shrink-0 ${deadlineClass}`}>
              {closed ? "Closed" : urgent ? `${days}d — urgent` : `${days}d left`}
            </span>
          )}
        </div>

        <h3 className="font-display text-xl mt-3 text-ink leading-snug line-clamp-2">
          {opportunity.title}
        </h3>
        <p className="text-sm text-slate mt-1">{opportunity.provider}</p>

        {opportunity.fieldsOfStudy.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {opportunity.fieldsOfStudy.slice(0, 3).map((f) => (
              <span
                key={f}
                className="text-xs bg-surface border border-rule text-ink-soft px-2 py-0.5 rounded"
              >
                {f}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate font-mono">
          <span>{opportunity.country}</span>
          <span className="uppercase tracking-wide">
            {opportunity.degreeLevel.replace(/_/g, " ")}
          </span>
        </div>
      </article>
    </Link>
  );
}
