import React from "react";
import { AlertTriangle, CheckCircle2, Shield, TriangleAlert, XCircle } from "lucide-react";
import { AuthCheck, SecurityTone } from "../../types/defender";

const statusClass: Record<SecurityTone, string> = {
  success: "border-success/30 bg-success/10 text-success",
  danger: "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/12 text-warning",
  muted: "border-border/80 bg-muted text-muted-foreground",
};

const toneIconMap: Record<SecurityTone, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  danger: XCircle,
  warning: TriangleAlert,
  muted: AlertTriangle,
};

interface AuthenticationSignalsProps {
  stepNumber?: string;
  authChecks: AuthCheck[];
}

export const AuthenticationSignals: React.FC<AuthenticationSignalsProps> = ({ stepNumber, authChecks }) => {
  return (
    <section className="investigation-card border border-border/80 bg-card/80 shadow-xl backdrop-blur-xl">
      <div className="section-topline flex items-center gap-3">
        <span className="section-icon">
          <Shield className="h-5 w-5 text-info" />
        </span>
        <div>
          <div className="flex items-center gap-2">
            <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">
              Authentication
            </p>
            {stepNumber && (
              <span className="font-mono text-[10px] font-bold text-muted-foreground/50 bg-muted/40 border border-border/50 px-1.5 py-0.2 rounded">
                {stepNumber}
              </span>
            )}
          </div>
          <h2 className="text-xl font-semibold tracking-[-0.03em] text-foreground md:text-2xl">
            Verification Signals
          </h2>
        </div>
      </div>

      <div className="space-y-2.5">
        {authChecks.length > 0 ? (
          authChecks.map(({ label, value, tone }) => {
            const Icon = toneIconMap[tone] || AlertTriangle;
            return (
              <div
                key={label}
                className="auth-row flex items-center justify-between p-2.5 sm:p-3 rounded-xl border border-border/70 bg-background/50 hover:bg-accent/40 transition-colors"
              >
                <span className="text-xs font-semibold text-foreground font-mono">{label}</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-wider ${
                    statusClass[tone] || statusClass.muted
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {value}
                </span>
              </div>
            );
          })
        ) : (
          <div className="empty-state py-8 text-center">
            <p className="empty-title text-sm font-semibold text-foreground">Authentication status unverified</p>
            <p className="empty-copy text-xs text-muted-foreground mt-1">
              SPF, DKIM, DMARC, and Return-Path checks will display here.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
