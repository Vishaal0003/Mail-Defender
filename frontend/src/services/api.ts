import { AiReport } from "../types/defender";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface AnalyzeEmailPayload {
  emailHeaders: string;
  emailBody: string;
}

export interface AnalyzeEmailResponse {
  data?: AiReport;
  error?: string;
}

export const analyzeEmail = async (payload: AnalyzeEmailPayload): Promise<AiReport> => {
  const response = await fetch(`${API_BASE_URL}/api/analyze-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result: AnalyzeEmailResponse = await response.json();

  if (!response.ok || result.error) {
    throw new Error(result.error || `Analysis request failed with status ${response.status}`);
  }

  if (!result.data) {
    throw new Error("Received an empty or invalid response from security engine.");
  }

  return result.data;
};
