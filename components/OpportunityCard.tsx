import Link from "next/link";
import { Opportunity } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = {
  scholarship: "Scholarship",
  study_program: "Study Program",
  immigration_pathway: "Immigration Pathway",
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
  const urgent = days !== null && days <= 30 && days >= 0;
  const closed = days !== null && days < 0;

  return (
    <Link href={`/opportunities/${opportunity._id}`}>
      <article className="case-card p-5 pl-6 hover:shadow-sm transition-shadow h-full flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <span className="stamp text-forest border-forest">{TYPE_LABELS[opportunity.type]}</span>
          {opportunity.deadline && (
            <span
              className={`font-mono text-xs whitespace-nowrap ${
                closed ? "text-slate" : urgent ? "text-alert" : "text-ink-soft"
              }`}
            >
              {closed ? "Closed" : `${days}d left`}
            </span>
          )}
        </div>

        <h3 className="font-display text-xl mt-3 text-ink leading-snug">{opportunity.title}</h3>
        <p className="text-sm text-slate mt-1">{opportunity.provider}</p>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {opportunity.fieldsOfStudy.slice(0, 3).map((f) => (
            <span key={f} className="text-xs border border-rule px-2 py-0.5 text-ink-soft">
              {f}
            </span>
          ))}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between text-xs text-slate font-mono">
          <span>{opportunity.country}</span>
          <span className="uppercase">{opportunity.degreeLevel.replace("_", " ")}</span>
        </div>
      </article>
    </Link>
  );
}
