"use client";

import Link from "next/link";

interface Props {
  feature: "coaching" | "essays" | "recommendations" | "roadmap" | "interview" | "mentor";
}

const COPY: Record<Props["feature"], { heading: string; body: string }> = {
  coaching: {
    heading: "You've used your free coaching generation",
    body: "Upgrade to Pro to generate coaching for unlimited opportunities — each one tailored to your exact CV and the scholarship's real requirements.",
  },
  essays: {
    heading: "Essay review is a Pro feature",
    body: "Upgrade to Pro to submit essay drafts and get line-by-line feedback against your CV and the opportunity's criteria.",
  },
  recommendations: {
    heading: "Personalised matching is a Pro feature",
    body: "Upgrade to Pro to see every opportunity sorted by how well your profile fits the criteria — so you put your time into the applications you're actually competitive for.",
  },
  roadmap: {
    heading: "Your Roadmap is a Pro feature",
    body: "Upgrade to Pro to generate a week-by-week application plan built around your goals, target countries, timeline, and test scores.",
  },
  interview: {
    heading: "Mock Interview is a Pro feature",
    body: "Upgrade to Pro to practice with tailored questions for any scholarship in your list and get detailed feedback on every answer — including what a stronger response looks like.",
  },
  mentor: {
    heading: "You've reached your free message limit",
    body: "Upgrade to Pro for unlimited conversations with your mentor — ask follow-up questions, go deep on any scholarship, and come back any time.",
  },
};

export default function UpgradePrompt({ feature }: Props) {
  const { heading, body } = COPY[feature];
  return (
    <div className="case-card p-6 mt-6" style={{ borderLeft: "3px solid #D97706" }}>
      <p className="font-mono text-xs tracking-widest uppercase text-brass mb-2">Pro required</p>
      <h3 className="font-display text-xl text-ink">{heading}</h3>
      <p className="text-ink-soft text-sm mt-2 leading-relaxed">{body}</p>
      <Link href="/pricing" className="btn-primary inline-flex mt-4 text-sm">
        See Pro plans →
      </Link>
    </div>
  );
}
