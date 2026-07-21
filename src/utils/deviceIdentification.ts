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

  const patterns = [
    /\(\s*S\s*\)\s*Serial\s*No\.?\s*[:\-]?\s*([A-Z0-9]{6,20})\b/i,
    /\bSerial\s*No\.?\s*[:\-]?\s*([A-Z0-9]{6,20})\b/i,
    /\bSN[:\s-]*([A-Z0-9]{6,20})\b/i,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return normalizeSerial(match[1]);
    }
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
