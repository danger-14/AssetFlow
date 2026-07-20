import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import type { ShipmentDevice } from "../types/importShipment";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const SERIAL_RE = /\bSN:\s*([A-Z0-9]+)\b/i;
const DEVICE_START_RE =
  /\b(MacBook(?: Pro| Air)?|Mac mini|Mac Mini|iPhone|iPad|Pixel|Google Pixel|Apple Watch)\b/i;

function normalizeSerial(serial: string): string {
  return serial.trim().replace(/\s+/g, "").replace(/^S/i, "");
}

function normalizeModel(model: string): string {
  return model
    .replace(/\s+/g, " ")
    .replace(/\s+(?:\d+-)?core CPU.*$/i, "")
    .replace(/\s+CTO.*$/i, "")
    .replace(/\s+Nano-texture.*$/i, "")
    .replace(/\s+Space Black.*$/i, "")
    .trim();
}

function extractModelFromLine(line: string): string | null {
  const serialMatch = line.match(SERIAL_RE);
  if (!serialMatch || serialMatch.index == null) return null;

  const beforeSerial = line.slice(0, serialMatch.index).trim();
  const startMatch = beforeSerial.match(DEVICE_START_RE);

  if (!startMatch || startMatch.index == null) return null;

  const rawModel = beforeSerial.slice(startMatch.index).trim();
  return normalizeModel(rawModel) || null;
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
  const normalizedText = text.replace(/\u00A0/g, " ");
  const lines = normalizedText
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const devices: ShipmentDevice[] = [];

  lines.forEach((line, index) => {
    const serialMatch = line.match(SERIAL_RE);
    if (!serialMatch) return;

    const model = extractModelFromLine(line);
    const serial = normalizeSerial(serialMatch[1]);

    if (!model || !serial) return;

    devices.push({
      id: `${serial}-${index}`,
      model,
      serial,
      selected: true,
      source: "pdf",
    });
  });

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
