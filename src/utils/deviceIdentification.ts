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
  
    //
    // PRIORITY 1
    // Look ONLY after "(S) Serial No."
    //
    const serialSection = normalized.match(
      /\(\s*S\s*\)\s*Serial\s*No\.?\s*([\s\S]{0,80})/i
    );
  
    if (serialSection) {
      const serialMatch = serialSection[1].match(/\b([A-Z0-9]{8,20})\b/i);
  
      if (serialMatch) {
        return normalizeSerial(serialMatch[1]);
      }
    }
  
    //
    // PRIORITY 2
    // Standard "Serial No."
    //
    const serialNo = normalized.match(
      /Serial\s*No\.?\s*([\s\S]{0,80})/i
    );
  
    if (serialNo) {
      const serialMatch = serialNo[1].match(/\b([A-Z0-9]{8,20})\b/i);
  
      if (serialMatch) {
        return normalizeSerial(serialMatch[1]);
      }
    }
  
    //
    // PRIORITY 3
    // SN:
    //
    const sn = normalized.match(/SN[:\s]*([A-Z0-9]{8,20})/i);
  
    if (sn) {
      return normalizeSerial(sn[1]);
    }
  
    //
    // No fallback.
    //
    return "";
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
    "DISTRIBUTION",
    "INTERNATIONAL",
    "LIMITED",
    "HOLLYHILL",
    "INDUSTRIAL",
    "ESTATE",
    "CORK",
    "IRELAND",
    "MODEL",
    "PART",
    "NUMBER",
    "PRODUCT",
    "REV",
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
