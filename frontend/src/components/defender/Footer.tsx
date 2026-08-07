import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-border/80 bg-card/60 backdrop-blur-xl mt-12 py-8 transition-colors">
      <div className="mx-auto max-w-[1500px] px-4 md:px-8 xl:px-12">
        <div className="flex flex-col items-center justify-center pb-6 border-b border-border/60 text-xs text-muted-foreground/80">
          <p>AI can make mistakes, please double check responses.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-xs text-muted-foreground">
          <p className="font-medium text-center sm:text-left">
            © {new Date().getFullYear()} Mail Defender. Built for SOC Analysts & Security Researchers.
          </p>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="font-semibold text-foreground">
              AI outputs should be validated against internal security policies.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
