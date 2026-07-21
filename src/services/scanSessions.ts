import { supabase } from "../lib/supabaseClient";

export type ScanSessionRow = {
  id: string;
  serial: string | null;
  status: string;
  created_at: string | null;
  updated_at: string | null;
};

export async function createScanSession(sessionId: string) {
  const { error } = await supabase.from("scan_sessions").upsert(
    {
      id: sessionId,
      serial: null,
      status: "open",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}

export async function getScanSession(sessionId: string) {
  const { data, error } = await supabase
    .from("scan_sessions")
    .select("*")
    .eq("id", sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as ScanSessionRow | null;
}

export async function completeScanSession(sessionId: string, serial: string) {
  const { error } = await supabase.from("scan_sessions").upsert(
    {
      id: sessionId,
      serial,
      status: "scanned",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    return { ok: false as const, error: error.message };
  }

  return { ok: true as const };
}
