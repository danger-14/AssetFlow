import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import type { ShipmentDevice } from "../types/importShipment";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const DEVICE_LINE_RE =
  /^(?:\d+\.\s*)?(?<sku>[A-Z0-9/.-]+)\s+(?<model>.+?)\s+SN:\s*(?<serial>[A-Z0-9]+)\b/i;

function normalizeSerial(serial: string): string {
  return serial.trim().replace(/\s+/g, "").replace(/^S/i, "");
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
    const match = line.match(DEVICE_LINE_RE);
    if (!match?.groups) return;

    const model = match.groups.model.trim();
    const serial = normalizeSerial(match.groups.serial);

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
