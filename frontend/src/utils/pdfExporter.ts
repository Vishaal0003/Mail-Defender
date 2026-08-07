import { AiReport, Attachment, HeaderDetail, Indicator, StructuredReport } from "../types/defender";

const formatList = (value: unknown, fallback = "No data available."): string[] => {
  if (Array.isArray(value) && value.length > 0) return value.map(String);
  if (typeof value === "string" && value.trim()) return [value];
  return [fallback];
};

const sanitizePdfText = (value: unknown): string =>
  String(value ?? "")
    .replace(/\r/g, "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?");

const escapePdfText = (value: unknown): string =>
  sanitizePdfText(value)
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");

const wrapPdfLine = (value: string, maxLength = 94): string[] => {
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

export const buildStructuredReport = (
  aiReport: AiReport | null,
  headerDetails: HeaderDetail[],
  indicators: Indicator[],
  attachments: Attachment[]
): StructuredReport => {
  const generatedAt = new Date().toLocaleString();
  const analyzedFields = headerDetails.length
    ? headerDetails.map(([label, value]) => `${label}: ${value}`)
    : ["Header details were not available."];

  const observedSignals = indicators.length
    ? indicators.map((item) => `${item.label}: ${item.value} (${item.tags?.join(", ") || "No disposition"})`)
    : ["No URLs, domains, IPs, or hashes were reported by the indicator board."];

  const attachmentSignals = attachments.length
    ? attachments.map(
        (att) =>
          `${att.filename || "Unknown file"} - ${att.contentType || "unknown type"} - ${(att.size / 1024).toFixed(
            1
          )} KB - SHA256 ${att.hash}`
      )
    : ["No attachments were found in the message."];

  return {
    generatedAt,
    analyzedFields,
    observedSignals,
    attachmentSignals,
    findings: formatList(aiReport?.keyFindings),
    recommendations: formatList(
      aiReport?.recommendedActions,
      "Double check the sender, links, attachments, and business context before trusting this email."
    ),
  };
};

export const generatePdfBlob = (
  aiReport: AiReport,
  headerDetails: HeaderDetail[],
  indicators: Indicator[],
  attachments: Attachment[]
): Blob => {
  const structuredReport = buildStructuredReport(aiReport, headerDetails, indicators, attachments);
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
      "The message was analyzed using authentication checks, content signals, extracted indicators, and reputation lookups."
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
  const pages: (typeof lines)[] = [];

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
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> /F2 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >> >> >> /Contents ${contentId} 0 R >>`
    );
    pageIds.push(pageId);
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${
    pageIds.length
  } >>`;
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
