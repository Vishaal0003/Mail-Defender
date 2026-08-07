import React from "react";
import { Terminal } from "lucide-react";

export const HeroBanner: React.FC = () => {
  return (
    <section className="mx-auto max-w-[1500px] px-3 sm:px-4 pt-4 sm:pt-6 md:px-8 xl:px-12">
      <div className="hero-panel app-header flex flex-col justify-center rounded-2xl border border-border/80 bg-gradient-to-r from-card via-background to-card p-4 sm:p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="hero-noise" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6">
          <div className="space-y-2.5 sm:space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <div className="workspace-pill text-[9px] sm:text-[10px] px-2 py-0.5 sm:px-3 sm:py-1">
                <span className="status-dot bg-primary text-primary" />
                Security Analyst Terminal
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-mono text-muted-foreground bg-muted/50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-border/60">
                <Terminal className="h-3 w-3 text-primary" /> EML / RFC 822 Forensics
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-foreground font-display leading-tight">
              Analyze Suspicious Emails with <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-rose-400 to-amber-400">AI & VirusTotal</span>
            </h1>
            <p className="text-xs sm:text-sm md:text-base leading-relaxed text-muted-foreground max-w-2xl">
              Inspect raw headers, extract IPs/domains, evaluate SPF/DKIM authentication, and produce comprehensive security threat assessments in real-time.
            </p>
          </div>

          {/* Quick stats pills */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 shrink-0 w-full lg:w-auto">
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md text-center">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Auth Checks</span>
              <span className="text-xs sm:text-sm font-semibold text-primary font-mono mt-0.5">SPF • DKIM</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md text-center">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Threat Intel</span>
              <span className="text-xs sm:text-sm font-semibold text-rose-400 font-mono mt-0.5">VirusTotal</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md text-center">
              <span className="text-[10px] sm:text-xs text-muted-foreground">Export Format</span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-400 font-mono mt-0.5">PDF & Text</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
