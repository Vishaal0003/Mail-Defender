import React from "react";
import { Radar } from "lucide-react";
import { HeaderDetail } from "../../types/defender";

interface HeaderBreakdownProps {
  stepNumber?: string;
  headerDetails: HeaderDetail[];
}

export const HeaderBreakdown: React.FC<HeaderBreakdownProps> = ({ stepNumber, headerDetails }) => {
  return (
    <section className="investigation-card border border-border/80 bg-card/80 shadow-lg backdrop-blur-xl">
      <div className="section-topline flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="section-icon">
            <Radar className="h-5 w-5 text-info" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Metadata Extraction
              </p>
              {stepNumber && (
                <span className="font-mono text-[10px] font-bold text-muted-foreground/50 bg-muted/40 border border-border/50 px-1.5 py-0.2 rounded">
                  {stepNumber}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground md:text-2xl">
              Header Breakdown
            </h2>
          </div>
        </div>
        {headerDetails.length > 0 && (
          <span className="text-xs font-mono text-info bg-info/10 border border-info/20 px-2.5 py-1 rounded-full">
            {headerDetails.length} Fields
          </span>
        )}
      </div>

      <div className="data-table border border-border/70 rounded-xl overflow-hidden">
        {headerDetails.length > 0 ? (
          headerDetails.map(([label, value]) => (
            <div key={`${label}-${value}`} className="data-row hover:bg-accent/40 transition-colors">
              <div className="data-label text-xs font-mono font-semibold text-foreground bg-muted/30">{label}</div>
              <div className="data-value text-xs font-mono text-muted-foreground break-all">{value}</div>
            </div>
          ))
        ) : (
          <div className="empty-state py-10 text-center">
            <p className="empty-title text-sm font-semibold text-foreground">Header metadata will populate here</p>
            <p className="empty-copy text-xs text-muted-foreground mt-1">
              Run analysis to inspect parsed Subject, Return-Path, Sender IP, and Message-ID.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
