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
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";

const tagClass: Record<string, string> = {
  Malicious: "border-danger/35 bg-danger/10 text-danger",
  Suspicious: "border-warning/35 bg-warning/12 text-warning",
  Clean: "border-success/35 bg-success/12 text-success",
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
    <main className="min-h-screen bg-background text-foreground">
      <div className="page-shell">
        <div className="ambient-orb ambient-orb-left" />
        <div className="ambient-orb ambient-orb-right" />

        <section className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-5 md:px-8 md:py-8 xl:px-12">
          <header className="hero-panel app-header">
            <div className="hero-noise" />

            <div className="relative w-full">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-2xl space-y-4">
                  <div className="workspace-pill">
                    <span className="status-dot bg-primary text-primary" />
                    Security Investigation Workspace
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="hero-emblem">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div className="space-y-2.5">
                      <h1 className="max-w-2xl text-3xl font-semibold leading-none tracking-[-0.04em] text-foreground md:text-5xl lg:text-[3.35rem]">
                        MAIL DEFENDER
                      </h1>
                      <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-[15px]">
                        Paste headers, inspect suspicious signals, and generate an AI threat report inside a workspace
                        that feels curated instead of generic.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 lg:right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsLightMode((current) => !current)}
                    className="h-11 px-5"
                    aria-pressed={isLightMode}
                  >
                    {isLightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    {isLightMode ? "Light Mode" : "Dark Mode"}
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleReset} className="h-11 px-5">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
            <div className="space-y-6">
              <section
                className={`investigation-card investigation-card-strong relative overflow-hidden ${isDragging ? "ring-2 ring-primary/60" : ""}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
              >
                <div className="section-topline">
                  <span className={sectionIconClass}>
                    <ScanSearch className="h-5 w-5" />
                  </span>
                  <div className="space-y-1">
                    <p className="section-kicker">Input Section</p>
                    <h2 className={cardTitleClass}>Raw message intake</h2>
                  </div>
                </div>

                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  Drop an `.eml` file or paste the raw material manually. The structure stays the same, but the work
                  area now feels more deliberate and easier to scan.
                </p>

                {isDragging && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[26px] border border-primary/30 bg-background/85 backdrop-blur-xl">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/30 bg-primary/12 text-primary">
                        <Mail className="h-8 w-8" />
                      </div>
                      <p className="text-xl font-semibold tracking-[-0.03em] text-foreground">Drop your `.eml` file here</p>
                      <p className="text-sm text-muted-foreground">We'll split headers and body automatically.</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4">
                  <div className="field-shell">
                    <label className="field-label">Raw Email Headers</label>
                    <Textarea
                      value={emailHeaders}
                      onChange={(e) => setEmailHeaders(e.target.value)}
                      className="workspace-textarea font-mono"
                      placeholder="Paste raw email headers here..."
                    />
                  </div>

                  <div className="field-shell">
                    <label className="field-label">Email Body</label>
                    <Textarea
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      className="workspace-textarea"
                      placeholder="Paste email body here..."
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button variant="signal" size="lg" className="min-w-44" onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? <Activity className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {isAnalyzing ? "Analyzing..." : "Analyze Email"}
                  </Button>

                  <div className="relative overflow-hidden">
                    <input
                      type="file"
                      accept=".eml,.txt"
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files[0]);
                          e.target.value = "";
                        }
                      }}
                    />
                    <Button variant="panel" size="lg" className="pointer-events-none min-w-44">
                      <Mail className="h-4 w-4" />
                      Upload .eml
                    </Button>
                  </div>
                </div>
              </section>

              <section className="investigation-card">
                <div className="section-topline">
                  <span className={sectionIconClass}>
                    <Radar className="h-5 w-5 text-info" />
                  </span>
                  <div className="space-y-1">
                    <p className="section-kicker">Parsed Details</p>
                    <h2 className={cardTitleClass}>Header breakdown</h2>
                  </div>
                </div>

                <div className="data-table">
                  {headerDetails.length > 0 ? (
                    headerDetails.map(([label, value]) => (
                      <div key={`${label}-${value}`} className="data-row">
                        <div className="data-label">{label}</div>
                        <div className="data-value">{value}</div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p className="empty-title">Header fields will appear here</p>
                      <p className="empty-copy">Run analysis to populate parsed sender, routing, and subject details.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="investigation-card report-card">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="section-topline gap-4">
                    <span className={sectionIconClass}>
                      <FileText className="h-5 w-5 text-primary" />
                    </span>
                    <div className="space-y-1">
                      <p className="section-kicker">Formal Report</p>
                      <h2 className={cardTitleClass}>Security analysis report</h2>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button variant="panel" onClick={handleCopyReport} className="h-11 px-5" disabled={!aiReport}>
                      <Copy className="h-4 w-4" />
                      Copy Report
                    </Button>
                    <Button variant="signal" onClick={handleExportReport} className="h-11 px-5" disabled={!aiReport}>
                      <Download className="h-4 w-4" />
                      Export Report
                    </Button>
                  </div>
                </div>

                <div className="report-surface">
                  {aiReport ? (
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="report-block">
                        <span className="report-label text-primary">Verdict</span>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className={`formal-verdict ${aiReport.verdict === "High Risk" ? "formal-verdict-danger" : aiReport.verdict === "Suspicious" ? "formal-verdict-warning" : "formal-verdict-safe"}`}>
                            {aiReport.verdict}
                          </span>
                          <span className="text-sm font-semibold text-muted-foreground">Risk score: {aiReport.score ?? "N/A"}/100</span>
                        </div>
                      </div>

                      <div className="report-block">
                        <span className="report-label text-info">Attack Type</span>
                        <p className="report-value">{aiReport.attackType}</p>
                      </div>

                      <div className="report-block lg:col-span-2">
                        <span className="report-label text-primary">Executive Assessment</span>
                        <p className="report-value">
                          {aiReport.analystSummary || "The email was reviewed using authentication checks, extracted indicators, content signals, and reputation data."}
                        </p>
                      </div>

                      <div className="report-block report-compact-list">
                        <span className="report-label text-info">What Was Analyzed</span>
                        <ul className="report-list">
                          {headerDetails.length > 0
                            ? headerDetails.slice(0, 5).map(([label, value]) => <li key={`${label}-${value}`}>{label}: {value}</li>)
                            : <li>Raw headers, body content, sender metadata, authentication status, links, domains, IPs, and attachment hashes.</li>}
                        </ul>
                      </div>

                      <div className="report-block report-compact-list">
                        <span className="report-label text-warning">What Was Observed</span>
                        <ul className="report-list">
                          {indicators.length > 0
                            ? indicators.slice(0, 4).map((item) => <li key={`${item.label}-${item.query}`}>{item.label}: {item.value} ({item.tags?.join(", ") || "No disposition"})</li>)
                            : <li>No grouped URLs, domains, IPs, or hashes were detected.</li>}
                          {attachments.length > 0
                            ? attachments.slice(0, 2).map((att, index) => <li key={`${att.hash}-${index}`}>Attachment: {att.filename} ({(att.size / 1024).toFixed(1)} KB)</li>)
                            : <li>No attachments were found.</li>}
                        </ul>
                      </div>

                      <div className="report-block lg:col-span-2">
                        <span className="report-label text-warning">Key Findings</span>
                        <ul className="report-list">
                          {Array.isArray(aiReport.keyFindings)
                            ? aiReport.keyFindings.map((finding: string, index: number) => <li key={index}>{finding}</li>)
                            : <li>{aiReport.keyFindings}</li>}
                        </ul>
                      </div>

                      <div className="report-block report-recommendation lg:col-span-2">
                        <span className="report-label text-success">Recommendation</span>
                        <ul className="report-list">
                          {Array.isArray(aiReport.recommendedActions)
                            ? aiReport.recommendedActions.map((action: string, index: number) => <li key={index}>{action}</li>)
                            : <li>{aiReport.recommendedActions}</li>}
                          <li>Double check the sender identity, domains, links, attachments, and business context before taking action.</li>
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="empty-state min-h-[280px]">
                      <p className="empty-title">Your formal report appears here</p>
                      <p className="empty-copy max-w-xl">
                        Run the analyzer to generate a structured report covering what was analyzed, what was observed,
                        key findings, and recommendations.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 2xl:grid-cols-[1.05fr_0.95fr]">
                <section className="investigation-card score-card">
                  <div className="section-topline">
                    <span className={sectionIconClass}>
                      <Gauge className="h-5 w-5 text-primary" />
                    </span>
                    <div className="space-y-1">
                      <p className="section-kicker">Risk Summary</p>
                      <h2 className={cardTitleClass}>Phishing score card</h2>
                    </div>
                  </div>

                  <div className="score-shell">
                    <div className="score-ring">
                      <div className="score-core">
                        <span className="score-range">{aiReport?.score ?? "0"}</span>
                        <span className="score-caption">Risk index</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-center">
                      <p className="text-xl font-semibold tracking-[-0.03em] text-foreground">{aiReport?.verdict || "Verdict Pending"}</p>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {aiReport?.analystSummary || "Legitimate, suspicious, or phishing classification appears here after the API returns."}
                      </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2">
                      {scoreTags.map(([text, tone]: any) => (
                        <span key={text} className={`rounded-full border px-3 py-1.5 text-xs font-semibold tracking-[0.16em] uppercase ${tagClass[tone] || tagClass.Suspicious}`}>
                          {text}
                        </span>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="investigation-card">
                  <div className="section-topline">
                    <span className={sectionIconClass}>
                      <Shield className="h-5 w-5 text-info" />
                    </span>
                    <div className="space-y-1">
                      <p className="section-kicker">Auth Checks</p>
                      <h2 className={cardTitleClass}>Verification signals</h2>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {authChecks.length > 0 ? (
                      authChecks.map(({ label, value, tone }) => {
                        const Icon = toneIconMap[tone] || AlertTriangle;
                        return (
                          <div key={label} className="auth-row">
                            <span className="text-[15px] font-medium text-foreground">{label}</span>
                            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${statusClass[tone] || statusClass.muted}`}>
                              <Icon className="h-3.5 w-3.5" />
                              {value}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div className="empty-state min-h-[220px]">
                        <p className="empty-title">No authentication checks yet</p>
                        <p className="empty-copy">SPF, DKIM, DMARC, and reply-to validation will populate after analysis.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <section className="investigation-card">
                <div className="section-topline">
                  <span className={sectionIconClass}>
                    <Link2 className="h-5 w-5 text-warning" />
                  </span>
                  <div className="space-y-1">
                    <p className="section-kicker">IOC Extraction</p>
                    <h2 className={cardTitleClass}>Indicator review board</h2>
                  </div>
                </div>

                <div className="indicator-table">
                  <div className="indicator-head">
                    <span>Signal</span>
                    <span>Observed Value</span>
                    <span className="text-right">Disposition</span>
                  </div>

                  {indicators.length > 0 ? (
                    indicators.map((item) => (
                      <div key={`${item.label}-${item.query}-${item.value}`} className="indicator-row">
                        <span className="indicator-label">{item.label}</span>

                        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                          <div className="indicator-value-shell">
                            <span className="truncate font-mono text-sm text-foreground">{item.value}</span>
                            <Copy className="h-3.5 w-3.5 cursor-pointer text-muted-foreground transition-colors hover:text-foreground" />
                          </div>

                          <Button variant="panel" size="sm" className="h-10 self-start xl:self-auto" asChild>
                            <a href={`https://www.virustotal.com/gui/search/${encodeURIComponent(item.query)}`} target="_blank" rel="noopener noreferrer">
                              <ScanSearch className="h-3.5 w-3.5" />
                              VirusTotal
                            </a>
                          </Button>
                        </div>

                        <div className="flex flex-wrap justify-end gap-2">
                          {item.tags.map((tag: string) => (
                            <span key={tag} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] ${tagClass[tag] || tagClass.Suspicious}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p className="empty-title">Indicators will be grouped here</p>
                      <p className="empty-copy">URLs, domains, IPs, hashes, and sender addresses appear once extracted.</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="investigation-card">
                <div className="section-topline">
                  <span className={sectionIconClass}>
                    <Paperclip className="h-5 w-5 text-info" />
                  </span>
                  <div className="space-y-1">
                    <p className="section-kicker">Extracted Files</p>
                    <h2 className={cardTitleClass}>Attachments</h2>
                  </div>
                </div>

                <div className="data-table">
                  {attachments.length > 0 ? (
                    attachments.map((att, idx) => (
                      <div key={idx} className="flex flex-col items-start gap-3 border-b border-border/85 p-4 last:border-0">
                        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-2">
                            <Paperclip className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <span className="font-semibold text-foreground break-all">{att.filename}</span>
                            <span className="shrink-0 text-sm text-muted-foreground">({(att.size / 1024).toFixed(1)} KB)</span>
                          </div>

                          <Button variant="panel" size="sm" className="h-8 shrink-0" asChild>
                            <a href={`https://www.virustotal.com/gui/file/${att.hash}`} target="_blank" rel="noopener noreferrer">
                              <ScanSearch className="h-3.5 w-3.5" />
                              Check VirusTotal
                            </a>
                          </Button>
                        </div>
                        <div className="hash-shell">
                          Hash: {att.hash}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state min-h-[140px]">
                      <p className="empty-title">No attachments found</p>
                      <p className="empty-copy">Any extracted files will be hashed and checked against VirusTotal.</p>
                    </div>
                  )}
                </div>
              </section>

            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Index;
