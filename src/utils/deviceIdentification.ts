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
  const normalized = text.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

  const directPatterns = [
    /\bSN[:\s-]*([A-Z0-9]{6,})\b/i,
    /\bSERIAL(?:\s+NUMBER)?[:\s-]*([A-Z0-9]{6,})\b/i,
  ];

  for (const pattern of directPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return normalizeSerial(match[1]);
    }
  }

  const candidates = normalized.match(/\b[A-Z0-9]{8,}\b/gi) ?? [];
  const blocked = new Set([
    "APPLE",
    "MACBOOK",
    "AIR",
    "PRO",
    "MIDNIGHT",
    "SILVER",
    "SPACE",
    "BLACK",
    "CTO",
    "CPU",
    "GPU",
    "CORE",
    "DEP",
    "NOTE",
    "WOLT",
    "FINLAND",
  ]);

  const candidate = candidates.find((token) => !blocked.has(token.toUpperCase()));
  return candidate ? normalizeSerial(candidate) : "";
}

export function detectModelFromText(text: string): DeviceCatalogItem | null {
  const simplifiedText = simplifyForMatch(text);

  return (
    deviceCatalog.find((item) =>
      simplifiedText.includes(simplifyForMatch(item.product))
    ) ?? null
  );
}
