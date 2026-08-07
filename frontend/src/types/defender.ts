export type SecurityTone = "success" | "danger" | "warning" | "muted";

export interface AuthCheck {
  label: string;
  value: string;
  tone: SecurityTone;
}

export type HeaderDetail = [string, string];

export interface Indicator {
  label: string;
  value: string;
  query: string;
  tags?: string[];
}

export interface Attachment {
  filename: string;
  contentType: string;
  size: number;
  hash: string;
}

export interface AiReport {
  verdict: string;
  score: number;
  attackType: string;
  analystSummary: string;
  keyFindings: string[] | string;
  recommendedActions: string[] | string;
  riskFactors?: string[];
  authChecks?: AuthCheck[];
  headerDetails?: HeaderDetail[];
  indicators?: Indicator[];
  attachments?: Attachment[];
}

export interface StructuredReport {
  generatedAt: string;
  analyzedFields: string[];
  observedSignals: string[];
  attachmentSignals: string[];
  findings: string[];
  recommendations: string[];
}
