import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AttachmentsReview } from "../components/defender/AttachmentsReview";
import { AuthenticationSignals } from "../components/defender/AuthenticationSignals";
import { ExtractedIndicatorsBoard } from "../components/defender/ExtractedIndicatorsBoard";
import { Footer } from "../components/defender/Footer";
import { HeaderBreakdown } from "../components/defender/HeaderBreakdown";
import { HeroBanner } from "../components/defender/HeroBanner";
import { IntakeSection } from "../components/defender/IntakeSection";
import { Navbar } from "../components/defender/Navbar";
import { SecurityReportCard } from "../components/defender/SecurityReportCard";

import { analyzeEmail } from "../services/api";
import { AiReport, Attachment, AuthCheck, HeaderDetail, Indicator } from "../types/defender";
import { buildStructuredReport, generatePdfBlob } from "../utils/pdfExporter";

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

const getStoredTheme = (): boolean => {
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
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [isLightMode, setIsLightMode] = useState<boolean>(getStoredTheme);

  const [authChecks, setAuthChecks] = useState<AuthCheck[]>([]);
  const [headerDetails, setHeaderDetails] = useState<HeaderDetail[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle("light", isLightMode);
    document.documentElement.style.colorScheme = isLightMode ? "light" : "dark";
    try {
      localStorage.setItem("mail-defender-theme", isLightMode ? "light" : "dark");
    } catch {
      // Theme works for session if storage is blocked
    }
  }, [isLightMode]);

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
      toast.success(`Loaded file: ${file.name}`);
    };
    reader.onerror = () => {
      toast.error("Failed to read file.");
    };
    reader.readAsText(file);
  };

  const loadSampleData = () => {
    setEmailHeaders(SAMPLE_EMAIL_HEADERS);
    setEmailBody(SAMPLE_EMAIL_BODY);
    toast.info("Loaded sample email headers & body.");
  };

  const handleReset = () => {
    setEmailHeaders("");
    setEmailBody("");
    setAiReport(null);
    setAuthChecks([]);
    setHeaderDetails([]);
    setIndicators([]);
    setAttachments([]);
    toast.info("Session reset successfully.");
  };

  const handleCopyReport = () => {
    if (!aiReport) {
      toast.error("No report generated yet.");
      return;
    }

    const structuredReport = buildStructuredReport(aiReport, headerDetails, indicators, attachments);
    const keyFindings = structuredReport.findings.map((finding) => `- ${finding}`).join("\n");
    const recommendedActions = structuredReport.recommendations.map((action) => `- ${action}`).join("\n");
    const observedSignals = structuredReport.observedSignals.map((signal) => `- ${signal}`).join("\n");

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
    toast.success("Security analysis report copied to clipboard!");
  };

  const handleExportReport = () => {
    if (!aiReport) {
      toast.error("Analyze an email first, then export the report.");
      return;
    }

    try {
      const blob = generatePdfBlob(aiReport, headerDetails, indicators, attachments);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Mail_Defender_Report_${new Date().getTime()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Exported PDF threat report.");
    } catch (error) {
      console.error("PDF Export error:", error);
      toast.error("Failed to generate PDF report.");
    }
  };

  const handleAnalyze = async () => {
    if (!emailHeaders && !emailBody) {
      toast.warning("Please provide email headers or body content to analyze.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const report = await analyzeEmail({ emailHeaders, emailBody });
      setAiReport(report);
      setAuthChecks(report.authChecks || []);
      setHeaderDetails(report.headerDetails || []);
      setIndicators(report.indicators || []);
      setAttachments(report.attachments || []);
      toast.success(`Analysis complete. Risk score: ${report.score}/100`);
    } catch (error: any) {
      console.error("Error analyzing email:", error);
      toast.error(error.message || "Failed to analyze email. Verify backend service.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary/30 selection:text-primary">
      <div className="page-shell flex-1">
        {/* Ambient background glows */}
        <div className="ambient-orb ambient-orb-left pointer-events-none" />
        <div className="ambient-orb ambient-orb-right pointer-events-none" />

        {/* Modular Navigation */}
        <Navbar
          isLightMode={isLightMode}
          onToggleTheme={() => setIsLightMode((curr) => !curr)}
          onLoadSample={loadSampleData}
          onReset={handleReset}
        />

        {/* Hero Section */}
        <HeroBanner />

        {/* Main Security Workstation - Single Column Aligned Flow */}
        <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-3 sm:px-4 py-4 sm:py-6 md:px-8 xl:px-12">
          <IntakeSection
            stepNumber="01 / 06"
            emailHeaders={emailHeaders}
            setEmailHeaders={setEmailHeaders}
            emailBody={emailBody}
            setEmailBody={setEmailBody}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleAnalyze}
            onLoadSample={loadSampleData}
            onFileUpload={handleFileUpload}
          />

          <HeaderBreakdown stepNumber="02 / 06" headerDetails={headerDetails} />

          <AuthenticationSignals stepNumber="03 / 06" authChecks={authChecks} />

          <ExtractedIndicatorsBoard stepNumber="04 / 06" indicators={indicators} />

          <AttachmentsReview stepNumber="05 / 06" attachments={attachments} />

          <SecurityReportCard
            stepNumber="06 / 06"
            aiReport={aiReport}
            headerDetails={headerDetails}
            indicators={indicators}
            attachments={attachments}
            onCopyReport={handleCopyReport}
            onExportPdf={handleExportReport}
          />
        </section>
      </div>

      {/* Global Footer */}
      <Footer />
    </div>
  );
};

export default Index;
