import React, { useState } from "react";
import { Activity, Mail, ScanSearch, Sparkles, Zap } from "lucide-react";
import { Button } from "../ui/button";
import { Textarea } from "../ui/textarea";

interface IntakeSectionProps {
  stepNumber?: string;
  emailHeaders: string;
  setEmailHeaders: (val: string) => void;
  emailBody: string;
  setEmailBody: (val: string) => void;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  onLoadSample: () => void;
  onFileUpload: (file: File) => void;
}

export const IntakeSection: React.FC<IntakeSectionProps> = ({
  stepNumber,
  emailHeaders,
  setEmailHeaders,
  emailBody,
  setEmailBody,
  isAnalyzing,
  onAnalyze,
  onLoadSample,
  onFileUpload,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <section
      className={`investigation-card investigation-card-strong relative overflow-hidden border border-border/80 bg-card/90 shadow-xl backdrop-blur-xl ${
        isDragging ? "ring-2 ring-primary/60 border-primary" : ""
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="section-topline flex items-center justify-between">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="section-icon">
            <ScanSearch className="h-5 w-5 text-primary" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="section-kicker text-[10px] sm:text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Raw Message Input
              </p>
              {stepNumber && (
                <span className="font-mono text-[10px] font-bold text-muted-foreground/50 bg-muted/40 border border-border/50 px-1.5 py-0.2 rounded">
                  {stepNumber}
                </span>
              )}
            </div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground md:text-2xl">
              Intake & Ingestion
            </h2>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onLoadSample}
          className="text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5 px-2 sm:px-3"
        >
          <Zap className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sample Email</span>
        </Button>
      </div>

      <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
        Drag & drop an <code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">.eml</code> file or paste headers & body manually below.
      </p>

      {isDragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[26px] border-2 border-dashed border-primary bg-background/90 backdrop-blur-xl">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/40 bg-primary/15 text-primary animate-bounce">
              <Mail className="h-8 w-8" />
            </div>
            <p className="text-lg font-semibold text-foreground">Drop `.eml` file here</p>
            <p className="text-xs text-muted-foreground">Headers & body will be auto-extracted.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        <div className="field-shell">
          <div className="flex items-center justify-between">
            <label className="field-label text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Raw Email Headers
            </label>
            {emailHeaders && (
              <span className="text-[11px] font-mono text-emerald-400">
                {emailHeaders.split("\n").length} lines
              </span>
            )}
          </div>
          <Textarea
            value={emailHeaders}
            onChange={(e) => setEmailHeaders(e.target.value)}
            className="workspace-textarea font-mono text-xs leading-relaxed border-border/80 focus:border-primary/50 transition-colors"
            placeholder="Paste raw RFC 822 email headers here (Received, DKIM-Signature, From, To, etc)..."
          />
        </div>

        <div className="field-shell">
          <div className="flex items-center justify-between">
            <label className="field-label text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Email Body Content
            </label>
            {emailBody && (
              <span className="text-[11px] font-mono text-emerald-400">{emailBody.length} chars</span>
            )}
          </div>
          <Textarea
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            className="workspace-textarea text-xs leading-relaxed border-border/80 focus:border-primary/50 transition-colors"
            placeholder="Paste text body or HTML content here..."
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 w-full">
        <Button
          variant="signal"
          size="lg"
          className="w-full sm:w-auto min-w-0 sm:min-w-[180px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_rgba(234,67,53,0.25)] transition-all hover:scale-[1.02] justify-center"
          onClick={onAnalyze}
          disabled={isAnalyzing || (!emailHeaders && !emailBody)}
        >
          {isAnalyzing ? (
            <>
              <Activity className="h-4 w-4 animate-spin text-primary-foreground" />
              Running Analysis...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze Email Threat
            </>
          )}
        </Button>

        <div className="relative overflow-hidden w-full sm:w-auto">
          <input
            type="file"
            accept=".eml,.txt"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onFileUpload(e.target.files[0]);
                e.target.value = "";
              }
            }}
          />
          <Button
            variant="panel"
            size="lg"
            className="w-full sm:w-auto min-w-0 sm:min-w-[150px] border-border/80 bg-card hover:bg-accent text-foreground justify-center"
          >
            <Mail className="h-4 w-4 text-primary" />
            Upload EML File
          </Button>
        </div>
      </div>
    </section>
  );
};
