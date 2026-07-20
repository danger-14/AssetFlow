import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import type { ShipmentDevice } from "../types/importShipment";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const SERIAL_RE = /\bSN:\s*([A-Z0-9]+)\b/gi;

const DEVICE_MARKERS = [
  "MacBook Pro",
  "MacBook Air",
  "Mac mini",
  "Mac Mini",
  "iPhone",
  "iPad",
  "Pixel",
  "Google Pixel",
  "Apple Watch",
];

const CHIP_RE = /\bApple\s+M\d+(?:\s+(?:Pro|Max|Ultra))?\b/i;

function normalizeSerial(serial: string): string {
  return serial.trim().replace(/\s+/g, "").replace(/^S/i, "");
}

function findLastDeviceMarkerIndex(text: string): number {
  const lower = text.toLowerCase();
  let bestIndex = -1;

  for (const marker of DEVICE_MARKERS) {
    const markerIndex = lower.lastIndexOf(marker.toLowerCase());
    if (markerIndex > bestIndex) {
      bestIndex = markerIndex;
    }
  }

  return bestIndex;
}

function extractBaseModel(text: string): string | null {
  const compact = text.replace(/\s+/g, " ").trim();
  const chipMatch = compact.match(CHIP_RE);

  if (chipMatch?.index == null) {
    return compact || null;
  }

  const endIndex = chipMatch.index + chipMatch[0].length;
  return compact.slice(0, endIndex).replace(/\s+/g, " ").trim() || null;
}

function extractModelFromChunk(chunk: string): string | null {
  const deviceStartIndex = findLastDeviceMarkerIndex(chunk);
  if (deviceStartIndex < 0) return null;

  const afterDeviceStart = chunk.slice(deviceStartIndex);
  return extractBaseModel(afterDeviceStart);
}

export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");

    pageTexts.push(pageText);
  }

  return pageTexts.join("\n");
}

export function parseShipmentDevicesFromText(text: string): ShipmentDevice[] {
  const normalizedText = text.replace(/\u00A0/g, " ").replace(/\r/g, "\n");
  const devices: ShipmentDevice[] = [];

  for (const match of normalizedText.matchAll(SERIAL_RE)) {
    const serial = normalizeSerial(match[1] ?? "");
    const serialIndex = match.index ?? -1;

    if (!serial || serialIndex < 0) continue;

    const chunkStart = Math.max(0, serialIndex - 260);
    const chunk = normalizedText.slice(chunkStart, serialIndex);

    if (/DEP\b|Apple Device Enrollment Program/i.test(chunk)) {
      continue;
    }

    const model = extractModelFromChunk(chunk);
    if (!model) continue;

    devices.push({
      id: `${serial}-${devices.length}`,
      model,
      serial,
      selected: true,
      source: "pdf",
    });
  }

  return devices;
}

export function createManualShipmentDevice(
  model: string,
  serial: string
): ShipmentDevice | null {
  const normalizedModel = model.trim();
  const normalizedSerial = normalizeSerial(serial);

  if (!normalizedModel || !normalizedSerial) {
    return null;
  }

  return {
    id: `manual-${normalizedSerial}`,
    model: normalizedModel,
    serial: normalizedSerial,
    selected: true,
    source: "manual",
  };
}
