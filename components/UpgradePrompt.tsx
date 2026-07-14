"use client";

import Link from "next/link";

interface Props {
  feature: "coaching" | "essays";
}

const COPY = {
  coaching: {
    heading: "You've used your free coaching generation",
    body: "Upgrade to Pro to generate coaching for unlimited opportunities — each one tailored to your exact CV and the scholarship's real requirements.",
  },
  essays: {
    heading: "Essay review is a Pro feature",
    body: "Upgrade to Pro to submit essay drafts and get line-by-line feedback against your CV and the opportunity's criteria.",
  },
};

export default function UpgradePrompt({ feature }: Props) {
  const { heading, body } = COPY[feature];
  return (
    <div className="case-card p-6 border-l-4 border-brass mt-6">
      <p className="font-mono text-xs tracking-widest uppercase text-brass">Pro required</p>
      <h3 className="font-display text-xl text-ink mt-2">{heading}</h3>
      <p className="text-ink-soft text-sm mt-2 leading-relaxed">{body}</p>
      <Link
        href="/pricing"
        className="inline-block mt-4 bg-forest text-paper px-5 py-2.5 text-sm hover:bg-forest-light transition-colors"
      >
        See Pro plans →
      </Link>
    </div>
  );
}
