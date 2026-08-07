import React from "react";
import { Gauge } from "lucide-react";
import { AiReport } from "../../types/defender";

const tagClass: Record<string, string> = {
  Malicious: "border-danger/35 bg-danger/10 text-danger shadow-[0_0_12px_rgba(239,68,68,0.15)]",
  Suspicious: "border-warning/35 bg-warning/12 text-warning shadow-[0_0_12px_rgba(245,158,11,0.15)]",
  Clean: "border-success/35 bg-success/12 text-success shadow-[0_0_12px_rgba(34,197,94,0.15)]",
  Unknown: "border-border/80 bg-muted text-muted-foreground",
};

const fallbackScoreTags: readonly (readonly [string, string])[] = [
  ["SPF Fail", "Malicious"],
  ["DKIM Fail", "Malicious"],
  ["Suspicious Link", "Suspicious"],
  ["Urgent Tone", "Suspicious"],
  ["Impersonation", "Clean"],
];

interface PhishingScoreCardProps {
  aiReport: AiReport | null;
}

export const PhishingScoreCard: React.FC<PhishingScoreCardProps> = ({ aiReport }) => {
  const scoreTags = aiReport?.riskFactors?.length
    ? aiReport.riskFactors.map((factor: string) => [factor, "Suspicious"] as const)
    : fallbackScoreTags;

  return (
    <section className="investigation-card score-card border border-border/80 bg-card/80 shadow-xl backdrop-blur-xl">
      <div className="section-topline flex items-center gap-3">
        <span className="section-icon">
          <Gauge className="h-5 w-5 text-primary" />
        </span>
        <div>
          <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">
            Risk Index
          </p>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground md:text-2xl">
            Phishing Score Card
          </h2>
        </div>
      </div>

      <div className="score-shell flex flex-col items-center p-4 sm:p-6 border border-border/70 rounded-2xl bg-background/40">
        <div className="score-ring relative mb-4">
          <div className="score-core flex flex-col items-center justify-center">
            <span className="score-range text-3xl sm:text-4xl font-bold font-display text-primary">
              {aiReport?.score ?? "0"}
            </span>
            <span className="score-caption text-[9px] sm:text-[10px] uppercase font-mono tracking-widest text-muted-foreground mt-1">
              Threat Score
            </span>
          </div>
        </div>

        <div className="space-y-2 text-center max-w-xs">
          <p className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            {aiReport?.verdict || "Awaiting Analysis"}
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            {aiReport?.analystSummary
              ? aiReport.analystSummary.slice(0, 110) + "..."
              : "Risk Index measures SPF/DKIM integrity, domain reputation, and urgent phish language."}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mt-4 pt-4 border-t border-border/60 w-full">
          {scoreTags.map(([text, tone]) => (
            <span
              key={text}
              className={`rounded-full border px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-mono font-semibold tracking-wider uppercase ${
                tagClass[tone] || tagClass.Suspicious
              }`}
            >
              {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
