const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:2222";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, init);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json();
}

// ── Settings / usage ────────────────────────────────────────────────────────

export interface AppSettings {
  model: string;
  provider: string;
  embed_model: string;
  entity_model: string;
  api_key_set: boolean;
  usage: { input_tokens: number; output_tokens: number };
  cost: {
    input_cost: number;
    output_cost: number;
    total_cost: number;
    input_rate: number;
    output_rate: number;
  } | null;
}

export interface ProviderInfo {
  name: string;
  base_url: string;
  key_required: boolean;
  models: string[];
}

export interface ProjectUsage {
  usage: { input_tokens: number; output_tokens: number };
  cost: { input_cost: number; output_cost: number; total_cost: number } | null;
}

export const getSettings = () => req<AppSettings>("/api/settings");
export const resetUsage = () =>
  req<{ status: string }>("/api/settings/reset-usage", { method: "POST" });
export const getProviders = () => req<Record<string, ProviderInfo>>("/api/settings/providers");
export const updateLLMSettings = (provider: string, model: string, api_key: string) =>
  req<{ status: string; provider: string; model: string }>("/api/settings/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, model, api_key }),
  });
export const getProjectUsage = (id: string) =>
  req<ProjectUsage>(`/api/projects/${id}/usage`);
export const resetProjectUsage = (id: string) =>
  req<{ status: string }>(`/api/projects/${id}/usage/reset`, { method: "POST" });

// ── KB ───────────────────────────────────────────────────────────────────────

export interface KBStatus {
  chunks: number;
  sources: string[];
  graph: Record<string, number>;
}

export const getKBStatus = () => req<KBStatus>("/api/kb/status");
export const clearKB = () =>
  req<{ status: string }>("/api/kb", { method: "DELETE" });

// ── Ingest ───────────────────────────────────────────────────────────────────

export interface IngestFileResult {
  file: string;
  type: string;
  status: "OK" | "REJECTED" | "FAIL" | "PENDING";
  chunks: number;
  entities: number;
  rels: number;
  reason?: string;
  error?: string;
  detected_type?: string;
}

export interface IngestResponse {
  results: IngestFileResult[];
}

export async function ingestFiles(
  files: File[],
  docType: string
): Promise<IngestResponse> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  fd.append("doc_type", docType);
  return req<IngestResponse>("/api/ingest", { method: "POST", body: fd });
}

// ── Projects ─────────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
  chunks: number;
  file_count: number;
}

export const listProjects = () => req<{ projects: Project[] }>("/api/projects");

export const createProject = (name: string, description: string) =>
  req<Project>("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, description }),
  });

export const deleteProject = (id: string) =>
  req<{ status: string }>(`/api/projects/${id}`, { method: "DELETE" });

export const getProjectKBStatus = (id: string) =>
  req<KBStatus>(`/api/projects/${id}/kb/status`);

export const clearProjectKB = (id: string) =>
  req<{ status: string }>(`/api/projects/${id}/kb`, { method: "DELETE" });

export async function ingestProjectFiles(
  projectId: string,
  files: File[],
  docType: string
): Promise<IngestResponse> {
  const fd = new FormData();
  files.forEach((f) => fd.append("files", f));
  fd.append("doc_type", docType);
  return req<IngestResponse>(`/api/projects/${projectId}/ingest`, { method: "POST", body: fd });
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function chatWithProject(
  projectId: string,
  message: string,
  history: ChatMessage[],
  context: string,
  onToken: (token: string) => void,
): Promise<void> {
  const res = await fetch(`${BASE}/api/projects/${projectId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, history, context }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Chat failed");
  }
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onToken(decoder.decode(value, { stream: true }));
  }
}

export interface ClarifyQuestion {
  id: string;
  question: string;
  hint?: string;
}

export const clarifyProject = (projectId: string, userStory: string) =>
  req<{ questions: ClarifyQuestion[] }>(`/api/projects/${projectId}/clarify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_story: userStory }),
  });

export const analyzeProject = (
  projectId: string,
  userStory: string,
  answers?: Record<string, string>,
) =>
  req<AnalyzeResult>(`/api/projects/${projectId}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_story: userStory, clarifying_answers: answers }),
  });

// ── Analyze ──────────────────────────────────────────────────────────────────

export interface TestScenario {
  id: string;
  type: string;
  scenario_type: string;
  title: string;
  description: string;
  preconditions: string[];
  steps: string[];
  expected_result: string;
  risk_level: "high" | "medium" | "low";
  traceability: string;
  kb_grounded?: boolean;
}

export interface GherkinCase {
  feature: string;
  scenario_title: string;
  given: string[];
  when: string[];
  then: string[];
  tags: string[];
}

export interface RiskArea {
  feature: string;
  module: string;
  risk_score: number;
  priority: "P1" | "P2" | "P3" | "P4";
  reasons: string[];
  past_bug_count: number;
}

export interface AnalyzeResult {
  feature_understanding: string;
  impacted_modules: { id: string; name: string; impact_type?: string; criticality?: number }[];
  event_flow: { step: number; layer: string; component: string; action: string; data?: string; validation_point: string }[];
  risk_areas: RiskArea[];
  heads_up_warnings: { warning: string; recommendation: string; severity?: string }[];
  test_scenarios: TestScenario[];
  gherkin_test_cases: GherkinCase[];
  regression_suite: { test_case_name: string; priority: string; reason: string; module?: string }[];
  regression_gherkin: GherkinCase[];
  test_cases_to_update: { id: string; name?: string; reason?: string }[];
  missing_coverage: { area: string; description: string; recommendation?: string }[];
  api_event_validation: {
    endpoint: string;
    method: string;
    validations: string[];
    event_triggers: string[];
    db_impacts: string[];
  }[];
  feature_name: string;
  detected_module: string;
  detected_priority: string;
  overall_risk: string;
  complexity_level: string;
  feature_status: "existing" | "partial" | "new";
  feature_status_reason: string;
  total_scenarios: number;
  kb_sparse?: boolean;
  apis_inferred?: boolean;
  generated_at: string;
  token_usage?: { input_tokens: number; output_tokens: number };
}

export const analyze = (userStory: string) =>
  req<AnalyzeResult>("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_story: userStory }),
  });

// ── Analysis History ─────────────────────────────────────────────────────────

export interface StoredAnalysis {
  id: string;
  story: string;
  result: AnalyzeResult;
  timestamp: string;   // ISO string from backend
}

export const getProjectAnalyses = (projectId: string) =>
  req<{ analyses: StoredAnalysis[] }>(`/api/projects/${projectId}/analyses`);

export const deleteProjectAnalysis = (projectId: string, analysisId: string) =>
  req<{ status: string }>(`/api/projects/${projectId}/analyses/${analysisId}`, {
    method: "DELETE",
  });

export const clearProjectAnalyses = (projectId: string) =>
  req<{ status: string }>(`/api/projects/${projectId}/analyses`, {
    method: "DELETE",
  });

export async function exportAnalysisExcel(
  projectId: string,
  result: AnalyzeResult,
): Promise<void> {
  const res = await fetch(`${BASE}/api/projects/${projectId}/export/excel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ result, feature_name: result.feature_name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Export failed");
  }
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  const cd   = res.headers.get("Content-Disposition") ?? "";
  const match = cd.match(/filename="([^"]+)"/);
  a.href     = url;
  a.download = match ? match[1] : "QA_Analysis.xlsx";
  a.click();
  URL.revokeObjectURL(url);
}
