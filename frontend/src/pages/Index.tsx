import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Gauge,
  Link2,
  Mail,
  Moon,
  Radar,
  RotateCcw,
  ScanSearch,
  Shield,
  Sparkles,
  Sun,
  TriangleAlert,
  XCircle,
  Paperclip,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Lock,
  Cpu,
  RefreshCw,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";

const tagClass: Record<string, string> = {
  Malicious: "border-danger/35 bg-danger/10 text-danger shadow-[0_0_12px_rgba(239,68,68,0.15)]",
  Suspicious: "border-warning/35 bg-warning/12 text-warning shadow-[0_0_12px_rgba(245,158,11,0.15)]",
  Clean: "border-success/35 bg-success/12 text-success shadow-[0_0_12px_rgba(34,197,94,0.15)]",
  Unknown: "border-border/80 bg-muted text-muted-foreground",
};

const statusClass: Record<string, string> = {
  success: "border-success/30 bg-success/10 text-success",
  danger: "border-danger/30 bg-danger/10 text-danger",
  warning: "border-warning/30 bg-warning/12 text-warning",
  muted: "border-border/80 bg-muted text-muted-foreground",
};

const toneIconMap: Record<string, any> = {
  success: CheckCircle2,
  danger: XCircle,
  warning: TriangleAlert,
  muted: AlertTriangle,
};

const sectionIconClass = "section-icon";

const cardTitleClass = "text-xl font-semibold tracking-[-0.03em] text-foreground md:text-2xl";

const fallbackScoreTags = [
  ["SPF Fail", "Malicious"],
  ["DKIM Fail", "Malicious"],
  ["Suspicious Link", "Suspicious"],
  ["Urgent Tone", "Suspicious"],
  ["Impersonation", "Clean"],
] as const;

const SAMPLE_EMAIL_HEADERS = `Received: from mail.suspicious-domain.com (unknown [192.168.1.100])
\tby mx.google.com with ESMTPS id x1234567890so
\tfor <target@company.com>; Wed, 05 Aug 2026 10:00:00 -0700
DKIM-Signature: v=1; a=rsa-sha256; c=relaxed/relaxed; d=fake-bank.net;
Authentication-Results: mx.google.com;
\tspf=fail (google.com: domain of admin@fake-bank.net does not designate 192.168.1.100 as permitted sender) smtp.mailfrom=admin@fake-bank.net;
\tdkim=fail header.i=@fake-bank.net;
From: "Security Urgent Notification" <admin@fake-bank.net>
To: target@company.com
Subject: URGENT: Your Account Has Been Locked - Immediate Verification Required
Date: Wed, 05 Aug 2026 10:00:00 -0700
X-Priority: 1 (Highest)
Reply-To: phisher-collector@login-verify-update.org`;

const SAMPLE_EMAIL_BODY = `Dear Customer,

We detected unauthorized login attempts on your account from an unrecognized IP address.
For your safety, your account features have been temporarily restricted.

Please verify your credentials immediately to restore full access:
http://login-verify-update.org/secure-auth/login.php

If you do not complete verification within 24 hours, your account will be permanently suspended.

Thank you,
Security Team
Support ID: SEC-994827`;

const getStoredTheme = () => {
  try {
    return localStorage.getItem("mail-defender-theme") === "light";
  } catch {
    return false;
  }
};

const Index = () => {
  const [emailHeaders, setEmailHeaders] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLightMode, setIsLightMode] = useState(getStoredTheme);

  const [authChecks, setAuthChecks] = useState<any[]>([]);
  const [headerDetails, setHeaderDetails] = useState<any[]>([]);
  const [indicators, setIndicators] = useState<any[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);

  const formatList = (value: any, fallback = "No data available.") =>
    Array.isArray(value) && value.length > 0 ? value : value ? [value] : [fallback];

  useEffect(() => {
    document.documentElement.classList.toggle("light", isLightMode);
    document.documentElement.style.colorScheme = isLightMode ? "light" : "dark";
    try {
      localStorage.setItem("mail-defender-theme", isLightMode ? "light" : "dark");
    } catch {
      // Theme still works for the current session if storage is unavailable.
    }
  }, [isLightMode]);

  const escapeHtml = (value: any) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const sanitizePdfText = (value: any) =>
    String(value ?? "")
      .replace(/\r/g, "")
      .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");

  const escapePdfText = (value: any) =>
    sanitizePdfText(value)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");

  const wrapPdfLine = (value: string, maxLength = 94) => {
    const words = sanitizePdfText(value).split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = "";

    words.forEach((word) => {
      if (word.length > maxLength) {
        if (current) {
          lines.push(current);
          current = "";
        }
        for (let index = 0; index < word.length; index += maxLength) {
          lines.push(word.slice(index, index + maxLength));
        }
        return;
      }

      const next = current ? `${current} ${word}` : word;
      if (next.length > maxLength) {
        lines.push(current);
        current = word;
      } else {
        current = next;
      }
    });

    if (current) lines.push(current);
    return lines.length ? lines : [""];
  };

  const buildStructuredReport = () => {
    const generatedAt = new Date().toLocaleString();
    const analyzedFields = headerDetails.length
      ? headerDetails.map(([label, value]) => `${label}: ${value}`)
      : ["Header details were not available."];
    const observedSignals = indicators.length
      ? indicators.map((item) => `${item.label}: ${item.value} (${item.tags?.join(", ") || "No disposition"})`)
      : ["No URLs, domains, IPs, or hashes were reported by the indicator board."];
    const attachmentSignals = attachments.length
      ? attachments.map((att) => `${att.filename || "Unknown file"} - ${att.contentType || "unknown type"} - ${(att.size / 1024).toFixed(1)} KB - SHA256 ${att.hash}`)
      : ["No attachments were found in the message."];

    return {
      generatedAt,
      analyzedFields,
      observedSignals,
      attachmentSignals,
      findings: formatList(aiReport?.keyFindings),
      recommendations: formatList(aiReport?.recommendedActions, "Double check the sender, links, attachments, and business context before trusting this email."),
    };
  };

  const buildPdfReportBlob = () => {
    const structuredReport = buildStructuredReport();
    const lines: { text: string; size?: number; bold?: boolean; gap?: boolean }[] = [];
    const addLine = (text = "", options: { size?: number; bold?: boolean; gap?: boolean } = {}) => {
      lines.push({ text, ...options });
    };
    const addWrapped = (text: string, prefix = "") => {
      wrapPdfLine(`${prefix}${text}`).forEach((line) => addLine(line));
    };
    const addSection = (title: string, items: string[]) => {
      addLine("", { gap: true });
      addLine(title.toUpperCase(), { size: 12, bold: true });
      items.forEach((item) => addWrapped(item, "- "));
    };

    addLine("Mail Defender Security Analysis Report", { size: 20, bold: true });
    addLine(`Generated: ${structuredReport.generatedAt}`, { size: 10 });
    addLine("", { gap: true });
    addLine(`Verdict: ${aiReport.verdict || "Pending"}`, { bold: true });
    addLine(`Attack Type: ${aiReport.attackType || "Unknown"}`, { bold: true });
    addLine(`Risk Score: ${aiReport.score ?? "N/A"}/100`, { bold: true });
    addLine("", { gap: true });
    addLine("EXECUTIVE ASSESSMENT", { size: 12, bold: true });
    wrapPdfLine(
      aiReport.analystSummary ||
      "The message was analyzed using authentication checks, content signals, extracted indicators, and reputation lookups.",
    ).forEach((line) => addLine(line));

    addSection("What Was Analyzed", structuredReport.analyzedFields);
    addSection("What Was Observed", structuredReport.observedSignals);
    addSection("Attachment Review", structuredReport.attachmentSignals);
    addSection("Key Findings", structuredReport.findings);
    addSection("Recommendations", [
      ...structuredReport.recommendations,
      "Final check: Double check the sender identity, domain, links, attachments, and business context before replying, clicking, downloading, or approving any request.",
    ]);

    const pageWidth = 612;
    const pageHeight = 792;
    const marginX = 48;
    const marginTop = 54;
    const lineHeight = 15;
    const maxLinesPerPage = 45;
    const pages: typeof lines[] = [];

    for (let index = 0; index < lines.length; index += maxLinesPerPage) {
      pages.push(lines.slice(index, index + maxLinesPerPage));
    }

    const contentStreams = pages.map((pageLines) => {
      let y = pageHeight - marginTop;
      return pageLines
        .map((line) => {
          const size = line.size || 10;
          const font = line.bold ? "F2" : "F1";
          if (line.gap) y -= 6;
          const command = `BT /${font} ${size} Tf ${marginX} ${y} Td (${escapePdfText(line.text)}) Tj ET`;
          y -= lineHeight;
          return command;
        })
        .join("\n");
    });

    const objects: string[] = [];
    const addObject = (content: string) => {
      objects.push(content);
      return objects.length;
    };

    const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesId = addObject("");
    const pageIds: number[] = [];

    contentStreams.forEach((stream) => {
      const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
      const pageId = addObject(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentId} 0 R >>`,
      );
      pageIds.push(pageId);
    });

    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((content, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${content}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += "0000000000 65535 f \n";
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return new Blob([pdf], { type: "application/pdf" });
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      const splitIndex = text.indexOf("\r\n\r\n") !== -1 ? text.indexOf("\r\n\r\n") : text.indexOf("\n\n");
      if (splitIndex !== -1) {
        setEmailHeaders(text.substring(0, splitIndex).trim());
        setEmailBody(text.substring(splitIndex).trim());
      } else {
        setEmailHeaders(text.substring(0, 2000));
        setEmailBody(text);
      }
    };
    reader.readAsText(file);
  };

  const loadSampleData = () => {
    setEmailHeaders(SAMPLE_EMAIL_HEADERS);
    setEmailBody(SAMPLE_EMAIL_BODY);
  };

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
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setEmailHeaders("");
    setEmailBody("");
    setAiReport(null);
    setAuthChecks([]);
    setHeaderDetails([]);
    setIndicators([]);
    setAttachments([]);
  };

  const handleCopyReport = () => {
    if (!aiReport) {
      alert("No report generated yet.");
      return;
    }

    const structuredReport = buildStructuredReport();
    const keyFindings = structuredReport.findings.map((finding: string) => `- ${finding}`).join("\n");
    const recommendedActions = structuredReport.recommendations.map((action: string) => `- ${action}`).join("\n");
    const observedSignals = structuredReport.observedSignals.map((signal: string) => `- ${signal}`).join("\n");

    const text = `MAIL DEFENDER SECURITY ANALYSIS REPORT
======================================

Generated:
${structuredReport.generatedAt}

VERDICT:
${aiReport.verdict}

ATTACK TYPE:
${aiReport.attackType}

RISK SCORE:
${aiReport.score ?? "N/A"}/100

ANALYST SUMMARY:
${aiReport.analystSummary || "No analyst summary was generated."}

WHAT WAS OBSERVED:
${observedSignals}

KEY FINDINGS:
${keyFindings}

RECOMMENDATIONS:
${recommendedActions}`;

    navigator.clipboard.writeText(text);
    alert("Report copied to clipboard!");
  };

  const handleExportReport = () => {
    if (!aiReport) {
      alert("Analyze an email first, then export the report.");
      return;
    }

    const blob = buildPdfReportBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Mail_Defender_Report_${new Date().getTime()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAnalyze = async () => {
    if (!emailHeaders && !emailBody) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("http://localhost:5000/api/analyze-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailHeaders, emailBody }),
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        alert(`Analysis failed: ${result.error || response.statusText}`);
        console.error("Backend error:", result);
        return;
      }

      if (result.data) {
        setAiReport(result.data);
        setAuthChecks(result.data.authChecks || []);
        setHeaderDetails(result.data.headerDetails || []);
        setIndicators(result.data.indicators || []);
        setAttachments(result.data.attachments || []);
      } else {
        console.error("No data returned:", result);
        alert("Received unexpected response from the server.");
      }
    } catch (error) {
      console.error("Error analyzing email:", error);
      alert("Failed to analyze email. Please make sure the backend is running and keys are valid.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scoreTags = aiReport?.riskFactors?.length
    ? aiReport.riskFactors.map((factor: string) => [factor, "Suspicious"])
    : fallbackScoreTags;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/30 selection:text-primary">
      <div className="page-shell flex-1">
        {/* Background Ambient Orbs */}
        <div className="ambient-orb ambient-orb-left pointer-events-none" />
        <div className="ambient-orb ambient-orb-right pointer-events-none" />

        {/* Sticky Premium Navbar Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-xl transition-all duration-300">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3.5 md:px-8 xl:px-12">
            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary shadow-[0_0_20px_rgba(56,189,248,0.2)]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-display text-lg font-bold tracking-tight text-foreground">
                    MAIL <span className="text-primary">DEFENDER</span>
                  </span>
                  <span className="rounded-md border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-wider text-primary">
                    PRO
                  </span>
                </div>
                <span className="text-[11px] text-muted-foreground hidden sm:inline-block">
                  AI Threat Detection & Header Forensic Engine
                </span>
              </div>
            </div>

            {/* Live Status Indicators */}
            <div className="hidden lg:flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2 border-r border-border/80 pr-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-medium text-foreground">Engine Online</span>
              </div>
              <div className="flex items-center gap-2 border-r border-border/80 pr-6">
                <Cpu className="h-3.5 w-3.5 text-primary" />
                <span>AI Core: <strong className="text-foreground">Gemini 2.5 Flash</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-3.5 w-3.5 text-info" />
                <span>VirusTotal API: <strong className="text-foreground font-mono">Ready</strong></span>
              </div>
            </div>

            {/* Top Bar Actions */}
            <div className="flex items-center gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadSampleData}
                className="hidden sm:inline-flex h-9 px-3 text-xs gap-1.5 border-border/80 bg-card/60 hover:bg-accent hover:border-primary/40"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                Load Sample
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-9 px-3 text-xs gap-1.5 border-border/80 bg-card/60 hover:bg-accent"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsLightMode((current) => !current)}
                className="h-9 w-9 p-0 border-border/80 bg-card/60 hover:bg-accent"
                aria-label="Toggle Theme"
              >
                {isLightMode ? <Moon className="h-4 w-4 text-slate-700" /> : <Sun className="h-4 w-4 text-amber-300" />}
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section Banner */}
        <section className="mx-auto max-w-[1500px] px-4 pt-6 md:px-8 xl:px-12">
          <div className="hero-panel app-header flex flex-col justify-center rounded-2xl border border-border/80 bg-gradient-to-r from-card via-background to-card p-6 md:p-8 shadow-2xl relative overflow-hidden">
            <div className="hero-noise" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-3 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="workspace-pill">
                    <span className="status-dot bg-primary text-primary" />
                    Security Analyst Terminal
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full border border-border/60">
                    <Terminal className="h-3 w-3 text-primary" /> EML / RFC 822 Forensics
                  </span>
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-4xl lg:text-4xl font-display">
                  Analyze Suspicious Emails with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-info to-purple-400">AI & VirusTotal</span>
                </h1>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base max-w-2xl">
                  Inspect raw headers, extract IPs/domains, evaluate SPF/DKIM authentication, and produce comprehensive security threat assessments in real-time.
                </p>
              </div>

              {/* Quick stats pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
                <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md">
                  <span className="text-xs text-muted-foreground">Auth Checks</span>
                  <span className="text-sm font-semibold text-primary font-mono mt-0.5">SPF • DKIM</span>
                </div>
                <div className="flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md">
                  <span className="text-xs text-muted-foreground">Threat Intel</span>
                  <span className="text-sm font-semibold text-info font-mono mt-0.5">VirusTotal API</span>
                </div>
                <div className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md">
                  <span className="text-xs text-muted-foreground">Export Format</span>
                  <span className="text-sm font-semibold text-emerald-400 font-mono mt-0.5">PDF & Text</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Work Area */}
        <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-8 xl:px-12">
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            
            {/* Left Column: Intake & Header Breakdown & Report */}
            <div className="space-y-6">
              
              {/* Intake Section */}
              <section
                className={`investigation-card investigation-card-strong relative overflow-hidden border border-border/80 bg-card/90 shadow-xl backdrop-blur-xl ${isDragging ? "ring-2 ring-primary/60 border-primary" : ""}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div className="section-topline flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={sectionIconClass}>
                      <ScanSearch className="h-5 w-5 text-primary" />
                    </span>
                    <div>
                      <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">Raw Message Input</p>
                      <h2 className={cardTitleClass}>Intake & Ingestion</h2>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadSampleData}
                    className="text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
                  >
                    <Zap className="h-3.5 w-3.5" /> Sample Email
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
                      <label className="field-label text-xs font-semibold tracking-wider text-muted-foreground uppercase">Raw Email Headers</label>
                      {emailHeaders && (
                        <span className="text-[11px] font-mono text-emerald-400">{emailHeaders.split('\n').length} lines</span>
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
                      <label className="field-label text-xs font-semibold tracking-wider text-muted-foreground uppercase">Email Body Content</label>
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

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Button 
                    variant="signal" 
                    size="lg" 
                    className="min-w-[180px] bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-[0_0_20px_rgba(56,189,248,0.25)] transition-all hover:scale-[1.02]" 
                    onClick={handleAnalyze} 
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

                  <div className="relative overflow-hidden inline-block">
                    <input
                      type="file"
                      accept=".eml,.txt"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0 z-10"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files[0]);
                          e.target.value = "";
                        }
                      }}
                    />
                    <Button variant="panel" size="lg" className="min-w-[150px] border-border/80 bg-card hover:bg-accent text-foreground">
                      <Mail className="h-4 w-4 text-primary" />
                      Upload EML File
                    </Button>
                  </div>
                </div>
              </section>

              {/* Parsed Header Details */}
              <section className="investigation-card border border-border/80 bg-card/80 shadow-lg backdrop-blur-xl">
                <div className="section-topline flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={sectionIconClass}>
                      <Radar className="h-5 w-5 text-info" />
                    </span>
                    <div>
                      <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">Metadata Extraction</p>
                      <h2 className={cardTitleClass}>Header Breakdown</h2>
                    </div>
                  </div>
                  {headerDetails.length > 0 && (
                    <span className="text-xs font-mono text-info bg-info/10 border border-info/20 px-2.5 py-1 rounded-full">
                      {headerDetails.length} Fields Extracted
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
                      <p className="empty-copy text-xs text-muted-foreground mt-1">Run analysis to inspect parsed Subject, Return-Path, Sender IP, and Message-ID.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* AI Report Card */}
              <section className="investigation-card report-card border border-border/80 bg-card/80 shadow-xl backdrop-blur-xl">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="section-topline flex items-center gap-3">
                    <span className={sectionIconClass}>
                      <FileText className="h-5 w-5 text-primary" />
                    </span>
                    <div>
                      <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">Executive Assessment</p>
                      <h2 className={cardTitleClass}>Security Analysis Report</h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    <Button variant="panel" onClick={handleCopyReport} size="sm" className="h-9 px-3.5 text-xs border-border/80 bg-card hover:bg-accent" disabled={!aiReport}>
                      <Copy className="h-3.5 w-3.5" />
                      Copy Text
                    </Button>
                    <Button variant="signal" onClick={handleExportReport} size="sm" className="h-9 px-3.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" disabled={!aiReport}>
                      <Download className="h-3.5 w-3.5" />
                      Export PDF
                    </Button>
                  </div>
                </div>

                <div className="report-surface border border-border/70 rounded-xl p-5 bg-background/50">
                  {aiReport ? (
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="report-block p-4 rounded-xl border border-border/60 bg-card/50">
                        <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-primary">Verdict</span>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5">
                          <span className={`formal-verdict px-3 py-1 text-xs font-bold rounded-full ${aiReport.verdict === "High Risk" ? "formal-verdict-danger bg-danger/15 text-danger border-danger/30" : aiReport.verdict === "Suspicious" ? "formal-verdict-warning bg-warning/15 text-warning border-warning/30" : "formal-verdict-safe bg-success/15 text-success border-success/30"}`}>
                            {aiReport.verdict}
                          </span>
                          <span className="text-xs font-mono font-semibold text-muted-foreground">Score: {aiReport.score ?? "N/A"}/100</span>
                        </div>
                      </div>

                      <div className="report-block p-4 rounded-xl border border-border/60 bg-card/50">
                        <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-info">Attack Classification</span>
                        <p className="report-value text-sm font-semibold text-foreground mt-1.5">{aiReport.attackType || "Unclassified"}</p>
                      </div>

                      <div className="report-block lg:col-span-2 p-4 rounded-xl border border-border/60 bg-card/50">
                        <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-primary">Analyst Executive Summary</span>
                        <p className="report-value text-xs md:text-sm text-foreground/90 leading-relaxed mt-1.5">
                          {aiReport.analystSummary || "The email was evaluated across header authentication metrics, domain signatures, content triggers, and reputation databases."}
                        </p>
                      </div>

                      <div className="report-block report-compact-list p-4 rounded-xl border border-border/60 bg-card/50">
                        <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-info">Analyzed Components</span>
                        <ul className="report-list text-xs text-muted-foreground space-y-1 mt-1.5">
                          {headerDetails.length > 0
                            ? headerDetails.slice(0, 4).map(([label, value]) => <li key={`${label}-${value}`} className="truncate"><strong className="text-foreground">{label}:</strong> {value}</li>)
                            : <li>Headers, subject line, return path, IP routing, links & attachments.</li>}
                        </ul>
                      </div>

                      <div className="report-block report-compact-list p-4 rounded-xl border border-border/60 bg-card/50">
                        <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-warning">Observed Signals</span>
                        <ul className="report-list text-xs text-muted-foreground space-y-1 mt-1.5">
                          {indicators.length > 0
                            ? indicators.slice(0, 3).map((item) => <li key={`${item.label}-${item.query}`} className="truncate"><strong className="text-foreground">{item.label}:</strong> {item.value}</li>)
                            : <li>No suspicious external domains or IPs flagged in indicators board.</li>}
                          {attachments.length > 0 && (
                            <li className="truncate"><strong className="text-foreground">Attachments:</strong> {attachments.length} file(s) scanned</li>
                          )}
                        </ul>
                      </div>

                      <div className="report-block lg:col-span-2 p-4 rounded-xl border border-border/60 bg-card/50">
                        <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-warning">Key Findings</span>
                        <ul className="report-list text-xs md:text-sm text-foreground/90 space-y-1.5 mt-1.5">
                          {Array.isArray(aiReport.keyFindings)
                            ? aiReport.keyFindings.map((finding: string, index: number) => <li key={index}>• {finding}</li>)
                            : <li>• {aiReport.keyFindings}</li>}
                        </ul>
                      </div>

                      <div className="report-block report-recommendation lg:col-span-2 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
                        <span className="report-label text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">Recommended Action Plan</span>
                        <ul className="report-list text-xs md:text-sm text-emerald-200/90 space-y-1.5 mt-1.5">
                          {Array.isArray(aiReport.recommendedActions)
                            ? aiReport.recommendedActions.map((action: string, index: number) => <li key={index}>✓ {action}</li>)
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

            </div>

            {/* Right Column: Score Card & Auth Checks & IOC Extraction & Attachments */}
            <div className="space-y-6">

              {/* Phishing Score Card */}
              <section className="investigation-card score-card border border-border/80 bg-card/80 shadow-xl backdrop-blur-xl">
                <div className="section-topline flex items-center gap-3">
                  <span className={sectionIconClass}>
                    <Gauge className="h-5 w-5 text-primary" />
                  </span>
                  <div>
                    <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">Risk Index</p>
                    <h2 className={cardTitleClass}>Phishing Score Card</h2>
                  </div>
                </div>

                <div className="score-shell flex flex-col items-center p-6 border border-border/70 rounded-2xl bg-background/40">
                  <div className="score-ring relative mb-4">
                    <div className="score-core flex flex-col items-center justify-center">
                      <span className="score-range text-4xl font-bold font-display text-primary">{aiReport?.score ?? "0"}</span>
                      <span className="score-caption text-[10px] uppercase font-mono tracking-widest text-muted-foreground mt-1">Threat Score</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-center max-w-xs">
                    <p className="text-lg font-bold tracking-tight text-foreground">{aiReport?.verdict || "Awaiting Analysis"}</p>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {aiReport?.analystSummary ? aiReport.analystSummary.slice(0, 110) + "..." : "Risk Index measures SPF/DKIM integrity, domain reputation, and urgent phish language."}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center gap-2 mt-4 pt-4 border-t border-border/60 w-full">
                    {scoreTags.map(([text, tone]: any) => (
                      <span key={text} className={`rounded-full border px-2.5 py-1 text-[10px] font-mono font-semibold tracking-wider uppercase ${tagClass[tone] || tagClass.Suspicious}`}>
                        {text}
                      </span>
                    ))}
                  </div>
                </div>
              </section>

              {/* Verification Signals (SPF/DKIM/DMARC) */}
              <section className="investigation-card border border-border/80 bg-card/80 shadow-xl backdrop-blur-xl">
                <div className="section-topline flex items-center gap-3">
                  <span className={sectionIconClass}>
                    <Shield className="h-5 w-5 text-info" />
                  </span>
                  <div>
                    <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">Authentication</p>
                    <h2 className={cardTitleClass}>Verification Signals</h2>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {authChecks.length > 0 ? (
                    authChecks.map(({ label, value, tone }) => {
                      const Icon = toneIconMap[tone] || AlertTriangle;
                      return (
                        <div key={label} className="auth-row flex items-center justify-between p-3 rounded-xl border border-border/70 bg-background/50 hover:bg-accent/40 transition-colors">
                          <span className="text-xs font-semibold text-foreground font-mono">{label}</span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${statusClass[tone] || statusClass.muted}`}>
                            <Icon className="h-3 w-3" />
                            {value}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="empty-state py-8 text-center">
                      <p className="empty-title text-sm font-semibold text-foreground">Authentication status unverified</p>
                      <p className="empty-copy text-xs text-muted-foreground mt-1">SPF, DKIM, DMARC, and Return-Path checks will display here.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Indicator Review Board (IOCs) */}
              <section className="investigation-card border border-border/80 bg-card/80 shadow-xl backdrop-blur-xl">
                <div className="section-topline flex items-center gap-3">
                  <span className={sectionIconClass}>
                    <Link2 className="h-5 w-5 text-warning" />
                  </span>
                  <div>
                    <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">IOC Board</p>
                    <h2 className={cardTitleClass}>Extracted Indicators</h2>
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
                      <div key={`${item.label}-${item.query}-${item.value}`} className="indicator-row p-3 border-t border-border/60 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="indicator-label text-xs font-mono font-bold text-foreground">{item.label}</span>
                          <div className="flex items-center gap-1">
                            {item.tags?.map((tag: string) => (
                              <span key={tag} className={`rounded-full border px-2 py-0.5 text-[9px] font-mono font-semibold uppercase ${tagClass[tag] || tagClass.Suspicious}`}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 bg-background/60 p-2 rounded-lg border border-border/60">
                          <span className="truncate font-mono text-[11px] text-foreground/90 max-w-[200px] sm:max-w-[240px]">{item.value}</span>
                          <Button variant="panel" size="sm" className="h-7 text-[10px] px-2 gap-1 border-border/80 hover:bg-accent shrink-0" asChild>
                            <a href={`https://www.virustotal.com/gui/search/${encodeURIComponent(item.query)}`} target="_blank" rel="noopener noreferrer">
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
                      <p className="empty-copy text-xs text-muted-foreground mt-1">Extracted URLs, domains, and IP addresses will be listed here.</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Extracted Attachments */}
              <section className="investigation-card border border-border/80 bg-card/80 shadow-xl backdrop-blur-xl">
                <div className="section-topline flex items-center gap-3">
                  <span className={sectionIconClass}>
                    <Paperclip className="h-5 w-5 text-info" />
                  </span>
                  <div>
                    <p className="section-kicker text-xs uppercase tracking-widest text-muted-foreground font-semibold">File Inspection</p>
                    <h2 className={cardTitleClass}>Attachments</h2>
                  </div>
                </div>

                <div className="data-table border border-border/70 rounded-xl overflow-hidden">
                  {attachments.length > 0 ? (
                    attachments.map((att, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-3 border-b border-border/70 last:border-0 hover:bg-accent/40 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="h-4 w-4 shrink-0 text-primary" />
                            <span className="font-semibold text-xs text-foreground truncate">{att.filename}</span>
                            <span className="shrink-0 text-[11px] font-mono text-muted-foreground">({(att.size / 1024).toFixed(1)} KB)</span>
                          </div>

                          <Button variant="panel" size="sm" className="h-7 text-[10px] px-2.5 gap-1 shrink-0" asChild>
                            <a href={`https://www.virustotal.com/gui/file/${att.hash}`} target="_blank" rel="noopener noreferrer">
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
                      <p className="empty-copy text-xs text-muted-foreground mt-1">Extracted file attachments and SHA256 hashes will appear here.</p>
                    </div>
                  )}
                </div>
              </section>

            </div>
          </div>
        </section>
      </div>

      {/* Premium Dark Mode Footer */}
      <footer className="w-full border-t border-border/80 bg-card/60 backdrop-blur-xl mt-12 py-8 transition-colors">
        <div className="mx-auto max-w-[1500px] px-4 md:px-8 xl:px-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-border/60">
            {/* Left Brand info */}
            <div className="flex items-center gap-3 text-left">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/40 bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm tracking-tight text-foreground">
                  MAIL <span className="text-primary">DEFENDER</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Advanced AI Email Security & Forensic Threat Platform
                </p>
              </div>
            </div>

            {/* Core Capability Badges */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-muted-foreground">
              <span className="px-2.5 py-1 rounded-md border border-border/60 bg-background/50">Header Parser</span>
              <span className="px-2.5 py-1 rounded-md border border-border/60 bg-background/50">SPF / DKIM Checks</span>
              <span className="px-2.5 py-1 rounded-md border border-border/60 bg-background/50">VT Integration</span>
              <span className="px-2.5 py-1 rounded-md border border-border/60 bg-background/50">PDF Export</span>
            </div>
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
    </div>
  );
};

export default Index;
