import { deviceCatalog } from "../data/deviceCatalog";
import type { DeviceCatalogItem } from "../types/device";

export function simplifyForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function normalizeSerial(value: string): string {
  return value
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^S(?=[A-Z0-9]{6,})/, "");
}

export function extractSerialFromText(text: string): string {
  const normalized = text.replace(/\u00A0/g, " ");

  // Priority 1 - (S) Serial No.
  const serialSection = normalized.match(
    /\(\s*S\s*\)\s*Serial\s*No\.?\s*([\s\S]{0,80})/i
  );

  if (serialSection) {
    const match = serialSection[1].match(/\b([A-Z0-9]{8,20})\b/i);

    if (match) {
      return normalizeSerial(match[1]);
    }
  }

  // Priority 2 - Serial No.
  const serialNo = normalized.match(/Serial\s*No\.?\s*([\s\S]{0,80})/i);

  if (serialNo) {
    const match = serialNo[1].match(/\b([A-Z0-9]{8,20})\b/i);

    if (match) {
      return normalizeSerial(match[1]);
    }
  }

  // Priority 3 - SN:
  const sn = normalized.match(/SN[: ]*([A-Z0-9]{8,20})/i);

  if (sn) {
    return normalizeSerial(sn[1]);
  }

  return "";
}

export function detectModelFromText(text: string): DeviceCatalogItem | null {
  const simplifiedText = simplifyForMatch(text);

  return (
    deviceCatalog.find((item) =>
      simplifiedText.includes(simplifyForMatch(item.product))
    ) ?? null
  );
}
