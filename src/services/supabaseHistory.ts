import { DoneItem } from "@/types/extension";

// ── Lightweight fetch-based client for the Supabase REST API (PostgREST) ──
// No @supabase/supabase-js dependency: we only need simple insert/select
// calls, and a plain fetch wrapper keeps the service-worker bundle small
// and avoids SDK features (realtime/websockets) we don't use.

export const CLOUD_TABLE = "resume_generations";

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

/** Row shape as stored in the `resume_generations` Postgres table (snake_case). */
export interface CloudRecord {
  id: string;
  created_at: string;
  company_name: string | null;
  role: string | null;
  job_description: string;
  original_resume: string;
  tailored_resume: string;
  model: string | null;
  api_url: string | null;
  source_url: string | null;
  keywords: DoneItem["keywords"] | null;
}

function isConfigured(config: Partial<SupabaseConfig>): config is SupabaseConfig {
  return Boolean(config.url && config.anonKey);
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function headers(config: SupabaseConfig, extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${config.anonKey}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

function doneItemToRow(item: DoneItem): Omit<CloudRecord, "id" | "created_at"> {
  return {
    company_name: item.companyName || null,
    role: item.role || null,
    job_description: item.jobDescription,
    original_resume: item.originalResume,
    tailored_resume: item.tailoredResume,
    model: item.model || null,
    api_url: item.apiUrl || null,
    source_url: item.sourceUrl || null,
    keywords: item.keywords || null,
  };
}

/**
 * Insert a completed tailoring result into the permanent cloud archive.
 * No-ops (resolves immediately) if Supabase hasn't been configured yet —
 * this feature is opt-in and must never block or break local saving.
 */
export async function insertGenerationRecord(
  config: Partial<SupabaseConfig>,
  item: DoneItem
): Promise<void> {
  if (!isConfigured(config)) return;

  const res = await fetch(`${normalizeUrl(config.url)}/rest/v1/${CLOUD_TABLE}`, {
    method: "POST",
    headers: headers(config, { Prefer: "return=minimal" }),
    body: JSON.stringify(doneItemToRow(item)),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase insert failed (${res.status}): ${text || res.statusText}`);
  }
}

export interface ListOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

/** List records from the cloud archive, newest first, optionally filtered by a search term. */
export async function listGenerationRecords(
  config: Partial<SupabaseConfig>,
  options: ListOptions = {}
): Promise<CloudRecord[]> {
  if (!isConfigured(config)) return [];

  const { search, limit = 100, offset = 0 } = options;
  const params = new URLSearchParams();
  params.set("select", "*");
  params.set("order", "created_at.desc");
  params.set("limit", String(limit));
  params.set("offset", String(offset));

  if (search && search.trim()) {
    const term = search.trim().replace(/[%,]/g, "");
    params.set(
      "or",
      `(company_name.ilike.*${term}*,role.ilike.*${term}*,job_description.ilike.*${term}*)`
    );
  }

  const res = await fetch(`${normalizeUrl(config.url)}/rest/v1/${CLOUD_TABLE}?${params.toString()}`, {
    method: "GET",
    headers: headers(config),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase list failed (${res.status}): ${text || res.statusText}`);
  }

  return res.json();
}

/** Quick connectivity/credentials check used by the Settings "Test Connection" button. */
export async function testConnection(config: Partial<SupabaseConfig>): Promise<void> {
  if (!isConfigured(config)) {
    throw new Error("Enter both the Project URL and the anon key first.");
  }

  const res = await fetch(
    `${normalizeUrl(config.url)}/rest/v1/${CLOUD_TABLE}?select=id&limit=1`,
    { method: "GET", headers: headers(config) }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Connection failed (${res.status}): ${text || res.statusText}`);
  }
}
