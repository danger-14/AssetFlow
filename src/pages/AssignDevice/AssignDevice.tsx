import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Tesseract from "tesseract.js";

import { deviceCatalog } from "../../data/deviceCatalog";
import { getInventoryBySerial, saveAssignment } from "../../services/inventory";
import "./AssignDevice.css";

function simplifyForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function normalizeSerial(value: string): string {
  return value
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "")
    .replace(/^S(?=[A-Z0-9]{6,})/, "");
}

function extractSerialFromText(text: string): string {
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

function detectModelFromText(text: string) {
  const simplifiedText = simplifyForMatch(text);

  return (
    deviceCatalog.find((item) =>
      simplifiedText.includes(simplifyForMatch(item.product))
    ) ?? null
  );
}

export default function AssignDevice() {
  const [serialNumber, setSerialNumber] = useState("");
  const [usedByEmail, setUsedByEmail] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [matchedInventory, setMatchedInventory] = useState<{
    serial: string;
    model: string;
    status: string;
    source: string;
    used_by: string | null;
  } | null>(null);
  const [needsManualModel, setNeedsManualModel] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [ocrText, setOcrText] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const selectedModel = useMemo(
    () => deviceCatalog.find((item) => item.id === selectedModelId) ?? null,
    [selectedModelId]
  );

  const resolvedModelText = matchedInventory?.model || selectedModel?.product || "";

  const stopScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const lookupSerial = async (rawSerial: string) => {
    const normalized = normalizeSerial(rawSerial);
  
    if (!normalized) {
      setMatchedInventory(null);
      setNeedsManualModel(false);
      setSelectedModelId("");
      return;
    }
  
    setSerialNumber(normalized);
    setIsLookingUp(true);
    setMatchedInventory(null);
    setNeedsManualModel(false);
    setSelectedModelId("");
    setErrorMessage("");
    setStatusMessage("");
  
    try {
      const device = await getInventoryBySerial(normalized);
  
      if (device) {
        setMatchedInventory(device);
        setStatusMessage("Device identified.");
        return;
      }
  
      setNeedsManualModel(true);
      setErrorMessage("Serial not found. Please select the model.");
    } catch {
      setErrorMessage("Could not search the inventory.");
    } finally {
      setIsLookingUp(false);
    }
  };

  const startScanner = async () => {
    setErrorMessage("");
    setStatusMessage("");
    setOcrText("");

    if (!videoRef.current) {
      setErrorMessage("Camera is not ready yet.");
      return;
    }

    stopScanner();
    setIsScanning(true);

    const reader = new BrowserMultiFormatReader();

    try {
      await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error, controls) => {
          controlsRef.current = controls ?? null;

          if (result) {
            stopScanner();
            void lookupSerial(result.getText());
            return;
          }

          if (error && !(error instanceof Error && error.name === "NotFoundException")) {
            setErrorMessage("Could not read the barcode or QR code.");
          }
        }
      );
    } catch {
      setErrorMessage("Could not start the camera.");
      stopScanner();
    }
  };

  const handlePhotoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    setErrorMessage("");
    setStatusMessage("");
    setIsReadingPhoto(true);
    setOcrText("");

    try {
      const result = await Tesseract.recognize(file, "eng");
      const text = result.data.text ?? "";
      setOcrText(text);

      const detectedSerial = extractSerialFromText(text);
      const detectedModel = detectModelFromText(text);

      if (detectedSerial) {
        setSerialNumber(detectedSerial);
        void lookupSerial(detectedSerial);
      } else if (detectedModel) {
        setSelectedModelId(detectedModel.id);
      } else {
        setErrorMessage("Could not find a serial number in the photo.");
      }
    } catch {
      setErrorMessage("Could not read the photo.");
    } finally {
      setIsReadingPhoto(false);
    }
  };

  const handleAssign = async () => {
    setErrorMessage("");
    setStatusMessage("");

    const serial = normalizeSerial(serialNumber);
    const usedBy = usedByEmail.trim();

    if (!serial) {
      setErrorMessage("Please scan or enter a serial number.");
      return;
    }

    if (!usedBy) {
      setErrorMessage("Please enter the Used By email address.");
      return;
    }

    const model = matchedInventory?.model || selectedModel?.product || "";

    if (!model) {
      setErrorMessage("Please select the model.");
      return;
    }

    try {
      setIsAssigning(true);

      const result = await saveAssignment({
        serial,
        model,
        usedBy,
        source: matchedInventory?.source || "Manual",
      });

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      setStatusMessage(`Ready: ${model} / ${serial} / ${usedBy}`);
      setMatchedInventory({
        serial,
        model,
        status: "Assigned",
        source: matchedInventory?.source || "Manual",
        used_by: usedBy,
      });
    } catch {
      setErrorMessage("Could not save the assignment.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClear = () => {
    stopScanner();
    setSerialNumber("");
    setUsedByEmail("");
    setSelectedModelId("");
    setMatchedInventory(null);
    setNeedsManualModel(false);
    setStatusMessage("");
    setErrorMessage("");
    setOcrText("");
  };

  return (
    <main className="assign-page">
      <header className="page-header">
        <p className="page-tag">Deployment</p>
        <h1>Assign Device</h1>
        <p>Scan a barcode, take a picture, or enter the serial number manually.</p>
      </header>

      <section className="assign-card">
        <div className="form-group">
          <label htmlFor="serial">Serial Number</label>
          <input
            id="serial"
            type="text"
            placeholder="Scan or enter serial number"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            onBlur={() => void lookupSerial(serialNumber)}
          />
        </div>

        <div className="scan-grid">
          <div className="scan-panel">
            <h2>Barcode / QR</h2>
            <video
              ref={videoRef}
              className={isScanning ? "scanner-video" : "scanner-video hidden"}
            />
            <div className="button-row">
              <button type="button" onClick={startScanner} disabled={isScanning}>
                {isScanning ? "Scanning..." : "Scan Barcode / QR"}
              </button>
              <button type="button" className="secondary" onClick={stopScanner}>
                Stop Camera
              </button>
            </div>
          </div>

          <div className="scan-panel">
            <h2>Photo OCR</h2>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden-input"
              onChange={handlePhotoUpload}
            />
            <div className="button-row">
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isReadingPhoto}
              >
                {isReadingPhoto ? "Reading Photo..." : "Take Picture"}
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => void lookupSerial(serialNumber)}
                disabled={isLookingUp}
              >
                {isLookingUp ? "Looking up..." : "Find Device"}
              </button>
            </div>
            <p className="helper-text">
              Read the box label if the barcode or QR code is not enough.
            </p>
          </div>
        </div>

        {matchedInventory ? (
          <section className="summary-card">
            <h2>Device Found</h2>
            <p>
              <strong>Model:</strong> {matchedInventory.model}
            </p>
            <p>
              <strong>Serial:</strong> {matchedInventory.serial}
            </p>
            <p>
              <strong>Status:</strong> {matchedInventory.status}
            </p>
            <p>
              <strong>Source:</strong> {matchedInventory.source}
            </p>
            {matchedInventory.used_by ? (
              <p>
                <strong>Used By:</strong> {matchedInventory.used_by}
              </p>
            ) : null}
          </section>
        ) : null}

        {needsManualModel ? (
          <div className="form-group">
            <label htmlFor="model">Model</label>
            <select
              id="model"
              value={selectedModelId}
              onChange={(e) => setSelectedModelId(e.target.value)}
            >
              <option value="">Select model</option>
              {deviceCatalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.product}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="form-group">
          <label htmlFor="usedBy">Used By</label>
          <input
            id="usedBy"
            type="email"
            placeholder="employee@wolt.com"
            value={usedByEmail}
            onChange={(e) => setUsedByEmail(e.target.value)}
          />
        </div>

        <div className="summary-card">
          <h2>Review</h2>
          <p>
            <strong>Model:</strong> {resolvedModelText || "Not selected"}
          </p>
          <p>
            <strong>Serial:</strong> {serialNumber || "Not scanned yet"}
          </p>
          <p>
            <strong>Used By:</strong> {usedByEmail || "Not entered yet"}
          </p>
        </div>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        {statusMessage ? <p className="status-text">{statusMessage}</p> : null}

        {ocrText ? (
          <details className="ocr-details">
            <summary>OCR text</summary>
            <pre>{ocrText}</pre>
          </details>
        ) : null}

        <div className="button-row">
          <button type="button" className="assign-button" onClick={handleAssign} disabled={isAssigning}>
            {isAssigning ? "Saving..." : "Assign Device"}
          </button>
          <button type="button" className="secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </section>
    </main>
  );
}
