import React from "react";
import { Moon, RotateCcw, ShieldCheck, Sun, Zap } from "lucide-react";
import { Button } from "../ui/button";

interface NavbarProps {
  isLightMode: boolean;
  onToggleTheme: () => void;
  onLoadSample: () => void;
  onReset: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  isLightMode,
  onToggleTheme,
  onLoadSample,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl transition-all duration-300">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-3 py-3 sm:px-4 md:px-8 xl:px-12">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary shadow-[0_0_20px_rgba(234,67,53,0.2)] shrink-0">
            <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-display text-base sm:text-lg font-bold tracking-tight text-foreground">
                MAIL <span className="text-primary">DEFENDER</span>
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground hidden sm:inline-block">
              AI Threat Detection & Header Forensic Engine
            </span>
          </div>
        </div>

        {/* Core Capability Badges */}
        <div className="hidden lg:flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground">
          <span className="px-2.5 py-1 rounded-md border border-border/60 bg-background/50">Header Parser</span>
          <span className="px-2.5 py-1 rounded-md border border-border/60 bg-background/50">SPF / DKIM Checks</span>
          <span className="px-2.5 py-1 rounded-md border border-border/60 bg-background/50">VT Integration</span>
          <span className="px-2.5 py-1 rounded-md border border-border/60 bg-background/50">PDF Export</span>
        </div>

        {/* Top Bar Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onLoadSample}
            className="h-8 sm:h-9 px-2.5 sm:px-3 text-[11px] sm:text-xs gap-1 sm:gap-1.5 border-border/80 bg-card/60 hover:bg-accent hover:border-primary/40"
          >
            <Zap className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden xs:inline">Load Sample</span>
            <span className="xs:hidden">Sample</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="h-8 sm:h-9 px-2.5 sm:px-3 text-[11px] sm:text-xs gap-1 sm:gap-1.5 border-border/80 bg-card/60 hover:bg-accent"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">Reset</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleTheme}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 border-border/80 bg-card/60 hover:bg-accent shrink-0"
            aria-label="Toggle Theme"
          >
            {isLightMode ? <Moon className="h-4 w-4 text-slate-700" /> : <Sun className="h-4 w-4 text-amber-300" />}
          </Button>
        </div>
      </div>
    </header>
  );
};
