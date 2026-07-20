import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import type { ShipmentDevice } from "../types/importShipment";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const DEVICE_ROW_RE =
  /(?:^|\s)(?<rowNumber>\d+\.)\s*(?<itemCode>[A-Z0-9/.-]+)\s+(?<rawModel>.+?)\s+SN:\s*(?<serial>[A-Z0-9]+)(?=\s+\d+\.\s+[A-Z0-9/.-]+\s+|$)/gi;

function normalizeSerial(serial: string): string {
  return serial.trim().replace(/\s+/g, "").replace(/^S/i, "");
}

function normalizeModel(model: string): string {
  return model
    .replace(/\s+/g, " ")
    .replace(/\s+\d+[,.]\d+\s*kg.*$/i, "")
    .replace(/\s+(?:\d+[- ]?Core CPU.*)$/i, "")
    .replace(/\s+CTO.*$/i, "")
    .replace(/\s+Nano-texture.*$/i, "")
    .replace(/\s+Space Black.*$/i, "")
    .replace(/\s+Midnight.*$/i, "")
    .replace(/\s+Silver.*$/i, "")
    .replace(/\s+Starlight.*$/i, "")
    .replace(/\s+Black.*$/i, "")
    .replace(/\s+Blue.*$/i, "")
    .trim();
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
  const devices: ShipmentDevice[] = [];

  for (const match of normalizedText.matchAll(DEVICE_ROW_RE)) {
    const rawModel = match.groups?.rawModel ?? "";
    const serial = normalizeSerial(match.groups?.serial ?? "");
    const model = normalizeModel(rawModel);

    if (!model || !serial) continue;

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
