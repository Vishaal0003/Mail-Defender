import React from "react";
import { ExternalLink, Paperclip } from "lucide-react";
import { Button } from "../ui/button";
import { Attachment } from "../../types/defender";

interface AttachmentsReviewProps {
  stepNumber?: string;
  attachments: Attachment[];
}

export const AttachmentsReview: React.FC<AttachmentsReviewProps> = ({ stepNumber, attachments }) => {
  return (
    <section className="investigation-card border border-border/80 bg-card/80 shadow-xl backdrop-blur-xl">
      <div className="section-topline flex items-center gap-3">
        <span className="section-icon">
          <Paperclip className="h-5 w-5 text-info" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              File Inspection
            </p>
            {stepNumber && (
              <span className="font-mono text-[10px] font-bold text-muted-foreground/50 bg-muted/40 border border-border/50 px-1.5 py-0.2 rounded">
                {stepNumber}
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground md:text-2xl">
            Attachments
          </h2>
        </div>
      </div>

      <div className="data-table border border-border/70 rounded-xl overflow-hidden">
        {attachments.length > 0 ? (
          attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-2 p-3 border-b border-border/70 last:border-0 hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="h-4 w-4 shrink-0 text-primary" />
                  <span className="font-semibold text-xs text-foreground truncate">{att.filename}</span>
                  <span className="shrink-0 text-[11px] font-mono text-muted-foreground">
                    ({(att.size / 1024).toFixed(1)} KB)
                  </span>
                </div>

                <Button variant="panel" size="sm" className="h-7 text-[10px] px-2.5 gap-1 shrink-0" asChild>
                  <a
                    href={`https://www.virustotal.com/gui/file/${att.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3 text-primary" />
                    VT Hash
                  </a>
                </Button>
              </div>
              <div className="hash-shell text-[10px] font-mono bg-muted/40 p-2 rounded border border-border/60 text-muted-foreground break-all">
                SHA256: {att.hash}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state py-8 text-center">
            <p className="empty-title text-sm font-semibold text-foreground">No attachments detected</p>
            <p className="empty-copy text-xs text-muted-foreground mt-1">
              Extracted file attachments and SHA256 hashes will appear here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
