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
  const lines = text
    .replace(/\u00A0/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const labelPatterns = [
    /\(\s*S\s*\)\s*Serial\s*No\.?\s*[:\-]?\s*([A-Z0-9]{6,20})\b/i,
    /\bSerial\s*No\.?\s*[:\-]?\s*([A-Z0-9]{6,20})\b/i,
    /\bSN[:\s-]*([A-Z0-9]{6,20})\b/i,
  ];

  for (const line of lines) {
    for (const pattern of labelPatterns) {
      const match = line.match(pattern);
      if (match?.[1]) {
        return normalizeSerial(match[1]);
      }
    }
  }

  for (let i = 0; i < lines.length; i += 1) {
    if (/\(\s*S\s*\)\s*Serial\s*No\.?/i.test(lines[i])) {
      const nextLine = lines[i + 1] ?? "";
      const nextMatch = nextLine.match(/\b([A-Z0-9]{6,20})\b/i);
      if (nextMatch?.[1]) {
        return normalizeSerial(nextMatch[1]);
      }
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
