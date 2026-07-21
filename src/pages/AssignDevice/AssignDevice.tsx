import { useEffect, useMemo, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Tesseract from "tesseract.js";

import { deviceCatalog } from "../../data/deviceCatalog";
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
  const [selectedModelId, setSelectedModelId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [ocrText, setOcrText] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const selectedModel = useMemo(
    () => deviceCatalog.find((item) => item.id === selectedModelId) ?? null,
    [selectedModelId]
  );

  const stopScanner = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current?.reset();
    readerRef.current = null;
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    readerRef.current = reader;

    try {
      await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error, controls) => {
          controlsRef.current = controls ?? null;

          if (result) {
            const scanned = normalizeSerial(result.getText());
            if (scanned) {
              setSerialNumber(scanned);
              setStatusMessage(`Serial captured: ${scanned}`);
            }
            stopScanner();
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
      }

      if (detectedModel) {
        setSelectedModelId(detectedModel.id);
      }

      if (detectedSerial || detectedModel) {
        setStatusMessage("Photo read successfully.");
      } else {
        setErrorMessage("Could not find a model or serial number in the photo.");
      }
    } catch {
      setErrorMessage("Could not read the photo.");
    } finally {
      setIsReadingPhoto(false);
    }
  };

  const handleAssign = () => {
    setErrorMessage("");
    setStatusMessage("");

    if (!selectedModel) {
      setErrorMessage("Please select a model.");
      return;
    }

    if (!serialNumber.trim()) {
      setErrorMessage("Please scan or enter a serial number.");
      return;
    }

    if (!userName.trim()) {
      setErrorMessage("Please enter a user name.");
      return;
    }

    setStatusMessage(
      `Ready to assign ${selectedModel.product} with serial ${serialNumber.trim()} to ${userName.trim()}.`
    );
  };

  const handleClear = () => {
    stopScanner();
    setSelectedModelId("");
    setSerialNumber("");
    setUserName("");
    setStatusMessage("");
    setErrorMessage("");
    setOcrText("");
  };

  return (
    <main className="assign-page">
      <header className="page-header">
        <p className="page-tag">Deployment</p>
        <h1>Assign Device</h1>
        <p>
          Scan a barcode or QR code, or take a picture of the box to capture the
          serial number.
        </p>
      </header>

      <section className="assign-card">
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

        <div className="scan-grid">
          <div className="scan-panel">
            <h2>Barcode / QR</h2>
            <video ref={videoRef} className={isScanning ? "scanner-video" : "scanner-video hidden"} />
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
            </div>
            <p className="helper-text">
              Take a picture of the box label to read the serial number.
            </p>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="serial">Serial Number</label>
          <input
            id="serial"
            type="text"
            placeholder="Serial number will fill here"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="user">Used By</label>
          <input
            id="user"
            type="text"
            placeholder="Enter user name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
        </div>

        <div className="summary-card">
          <h2>Preview</h2>
          <p>
            <strong>Model:</strong> {selectedModel?.product || "Not selected"}
          </p>
          <p>
            <strong>Serial:</strong> {serialNumber || "Not scanned yet"}
          </p>
          <p>
            <strong>User:</strong> {userName || "Not selected"}
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
          <button type="button" className="assign-button" onClick={handleAssign}>
            Assign Device
          </button>
          <button type="button" className="secondary" onClick={handleClear}>
            Clear
          </button>
        </div>
      </section>
    </main>
  );
}
