import { supabase } from "../lib/supabaseClient";
import type { ShipmentDevice } from "../types/importShipment";

export type InventoryRow = {
  id: string;
  serial: string;
  model: string;
  status: string;
  source: string;
  used_by: string | null;
  imported_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function saveShipmentDevices(
  devices: ShipmentDevice[]
): Promise<{ saved: number; error?: string }> {
  const rows = devices.map((device) => ({
    serial: device.serial,
    model: device.model,
    status: "Stock",
    source: device.source === "manual" ? "Manual" : "Import",
    used_by: null,
  }));

  const { error } = await supabase.from("inventory").upsert(rows, {
    onConflict: "serial",
  });

  if (error) {
    return { saved: 0, error: error.message };
  }

  return { saved: rows.length };
}

export async function getInventoryBySerial(serial: string) {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .eq("serial", serial)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function listInventory() {
  const { data, error } = await supabase
    .from("inventory")
    .select("*")
    .order("imported_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as InventoryRow[];
}
