import React from "react";
import { Copy, Download, FileText } from "lucide-react";
import { Button } from "../ui/button";
import { AiReport, Attachment, HeaderDetail, Indicator } from "../../types/defender";
import { buildStructuredReport } from "../../utils/pdfExporter";

interface SecurityReportCardProps {
  stepNumber?: string;
  aiReport: AiReport | null;
  headerDetails: HeaderDetail[];
  indicators: Indicator[];
  attachments: Attachment[];
  onCopyReport: () => void;
  onExportPdf: () => void;
}

export const SecurityReportCard: React.FC<SecurityReportCardProps> = ({
  stepNumber,
  aiReport,
  headerDetails,
  indicators,
  attachments,
  onCopyReport,
  onExportPdf,
}) => {
  return (
    <section className="investigation-card report-card border border-border/80 bg-card/80 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="section-topline flex items-center gap-3">
          <span className="section-icon">
            <FileText className="h-5 w-5 text-primary" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Executive Assessment
              </p>
              {stepNumber && (
                <span className="font-mono text-[10px] font-bold text-muted-foreground/50 bg-muted/40 border border-border/50 px-1.5 py-0.2 rounded">
                  {stepNumber}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground md:text-2xl">
              Security Analysis Report
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Button
            variant="panel"
            onClick={onCopyReport}
            size="sm"
            className="flex-1 sm:flex-none h-9 px-3.5 text-xs border-border/80 bg-card hover:bg-accent justify-center"
            disabled={!aiReport}
          >
            <Copy className="h-3.5 w-3.5" />
            Copy Text
          </Button>
          <Button
            variant="signal"
            onClick={onExportPdf}
            size="sm"
            className="flex-1 sm:flex-none h-9 px-3.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold justify-center"
            disabled={!aiReport}
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="report-surface border border-border/70 rounded-xl p-3.5 sm:p-5 bg-background/50">
        {aiReport ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="report-block p-4 rounded-xl border border-border/60 bg-card/50">
              <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-primary">
                Verdict
              </span>
              <div className="flex flex-wrap items-center gap-3 mt-1.5">
                <span
                  className={`formal-verdict px-3 py-1 text-xs font-bold rounded-full ${
                    aiReport.verdict === "High Risk"
                      ? "formal-verdict-danger bg-danger/15 text-danger border-danger/30"
                      : aiReport.verdict === "Suspicious"
                      ? "formal-verdict-warning bg-warning/15 text-warning border-warning/30"
                      : "formal-verdict-safe bg-success/15 text-success border-success/30"
                  }`}
                >
                  {aiReport.verdict}
                </span>
                <span className="text-xs font-mono font-semibold text-muted-foreground">
                  Score: {aiReport.score ?? "N/A"}/100
                </span>
              </div>
            </div>

            <div className="report-block p-4 rounded-xl border border-border/60 bg-card/50">
              <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-info">
                Attack Classification
              </span>
              <p className="report-value text-sm font-semibold text-foreground mt-1.5">
                {aiReport.attackType || "Unclassified"}
              </p>
            </div>

            <div className="report-block lg:col-span-2 p-4 rounded-xl border border-border/60 bg-card/50">
              <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-primary">
                Analyst Executive Summary
              </span>
              <p className="report-value text-xs md:text-sm text-foreground/90 leading-relaxed mt-1.5">
                {aiReport.analystSummary ||
                  "The email was evaluated across header authentication metrics, domain signatures, content triggers, and reputation databases."}
              </p>
            </div>

            <div className="report-block report-compact-list p-4 rounded-xl border border-border/60 bg-card/50">
              <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-info">
                Analyzed Components
              </span>
              <ul className="report-list text-xs text-muted-foreground space-y-1 mt-1.5">
                {headerDetails.length > 0
                  ? headerDetails
                      .slice(0, 4)
                      .map(([label, value]) => (
                        <li key={`${label}-${value}`} className="truncate">
                          <strong className="text-foreground">{label}:</strong> {value}
                        </li>
                      ))
                  : <li>Headers, subject line, return path, IP routing, links & attachments.</li>}
              </ul>
            </div>

            <div className="report-block report-compact-list p-4 rounded-xl border border-border/60 bg-card/50">
              <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-warning">
                Observed Signals
              </span>
              <ul className="report-list text-xs text-muted-foreground space-y-1 mt-1.5">
                {indicators.length > 0
                  ? indicators
                      .slice(0, 3)
                      .map((item) => (
                        <li key={`${item.label}-${item.query}`} className="truncate">
                          <strong className="text-foreground">{item.label}:</strong> {item.value}
                        </li>
                      ))
                  : <li>No suspicious external domains or IPs flagged in indicators board.</li>}
                {attachments.length > 0 && (
                  <li className="truncate">
                    <strong className="text-foreground">Attachments:</strong> {attachments.length} file(s) scanned
                  </li>
                )}
              </ul>
            </div>

            <div className="report-block lg:col-span-2 p-4 rounded-xl border border-border/60 bg-card/50">
              <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-warning">
                Key Findings
              </span>
              <ul className="report-list text-xs md:text-sm text-foreground/90 space-y-1.5 mt-1.5">
                {Array.isArray(aiReport.keyFindings)
                  ? aiReport.keyFindings.map((finding: string, index: number) => <li key={index}>• {finding}</li>)
                  : <li>• {aiReport.keyFindings}</li>}
              </ul>
            </div>

            <div className="report-block report-recommendation lg:col-span-2 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
              <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
                Recommended Action Plan
              </span>
              <ul className="report-list text-xs md:text-sm text-emerald-200/90 space-y-1.5 mt-1.5">
                {Array.isArray(aiReport.recommendedActions)
                  ? aiReport.recommendedActions.map((action: string, index: number) => (
                      <li key={index}>✓ {action}</li>
                    ))
                  : <li>✓ {aiReport.recommendedActions}</li>}
                <li>✓ Always verify identity via secondary channels before taking action on urgent requests.</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="empty-state min-h-[220px] text-center flex flex-col items-center justify-center">
            <FileText className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="empty-title text-sm font-semibold text-foreground">No Report Generated Yet</p>
            <p className="empty-copy text-xs text-muted-foreground max-w-sm mt-1">
              Submit email content or click "Sample Email" above to trigger an AI threat analysis.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
