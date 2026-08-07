import React from "react";
import { ExternalLink, Link2 } from "lucide-react";
import { Button } from "../ui/button";
import { Indicator } from "../../types/defender";

const tagClass: Record<string, string> = {
  Malicious: "border-danger/35 bg-danger/10 text-danger shadow-[0_0_12px_rgba(239,68,68,0.15)]",
  Suspicious: "border-warning/35 bg-warning/12 text-warning shadow-[0_0_12px_rgba(245,158,11,0.15)]",
  Clean: "border-success/35 bg-success/12 text-success shadow-[0_0_12px_rgba(34,197,94,0.15)]",
  Unknown: "border-border/80 bg-muted text-muted-foreground",
};

interface ExtractedIndicatorsBoardProps {
  stepNumber?: string;
  indicators: Indicator[];
}

export const ExtractedIndicatorsBoard: React.FC<ExtractedIndicatorsBoardProps> = ({ stepNumber, indicators }) => {
  return (
    <section className="investigation-card border border-border/80 bg-card/80 shadow-xl backdrop-blur-xl">
      <div className="section-topline flex items-center gap-3">
        <span className="section-icon">
          <Link2 className="h-5 w-5 text-warning" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              IOC Board
            </p>
            {stepNumber && (
              <span className="font-mono text-[10px] font-bold text-muted-foreground/50 bg-muted/40 border border-border/50 px-1.5 py-0.2 rounded">
                {stepNumber}
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground md:text-2xl">
            Extracted Indicators
          </h2>
        </div>
      </div>

      <div className="indicator-table border border-border/70 rounded-xl overflow-hidden">
        <div className="indicator-head bg-muted/30 p-2.5 text-[11px] font-mono font-bold uppercase text-muted-foreground grid grid-cols-12 gap-2">
          <span className="col-span-3">Signal</span>
          <span className="col-span-6">Value / Lookup</span>
          <span className="col-span-3 text-right">Tag</span>
        </div>

        {indicators.length > 0 ? (
          indicators.map((item) => (
            <div key={`${item.label}-${item.query}-${item.value}`} className="p-2.5 sm:p-3 border-t border-border/60 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="indicator-label text-xs font-mono font-bold text-foreground">{item.label}</span>
                <div className="flex items-center gap-1">
                  {item.tags?.map((tag: string) => (
                    <span
                      key={tag}
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-mono font-semibold uppercase ${
                        tagClass[tag] || tagClass.Suspicious
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-background/60 p-2 rounded-lg border border-border/60">
                <span className="truncate font-mono text-[11px] text-foreground/90 w-full sm:max-w-[240px] break-all">
                  {item.value}
                </span>
                <Button
                  variant="panel"
                  size="sm"
                  className="h-7 text-[10px] px-2.5 gap-1 border-border/80 hover:bg-accent shrink-0 self-start sm:self-auto"
                  asChild
                >
                  <a
                    href={`https://www.virustotal.com/gui/search/${encodeURIComponent(item.query)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 text-primary" />
                    VT Check
                  </a>
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state py-8 text-center">
            <p className="empty-title text-sm font-semibold text-foreground">No indicators extracted yet</p>
            <p className="empty-copy text-xs text-muted-foreground mt-1">
              Extracted URLs, domains, and IP addresses will be listed here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
