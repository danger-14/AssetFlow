import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import Tesseract from "tesseract.js";
import { useParams } from "react-router-dom";

import { completeScanSession } from "../../services/scanSessions";
import { extractSerialFromText } from "../../utils/deviceIdentification";
import "./ScanPhone.css";

export default function ScanPhone() {
  const { sessionId } = useParams();
  const [isScanning, setIsScanning] = useState(false);
  const [isReadingPhoto, setIsReadingPhoto] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [ocrText, setOcrText] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

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

  const submitSerial = async (rawSerial: string) => {
    if (!sessionId) {
      setErrorMessage("Missing scan session.");
      return;
    }

    const serial = rawSerial.trim().toUpperCase().replace(/\s+/g, "");
    if (!serial) {
      setErrorMessage("No serial number found.");
      return;
    }

    const result = await completeScanSession(sessionId, serial);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setStatusMessage(`Serial sent: ${serial}`);
  };

  const startScanner = async () => {
    setErrorMessage("");
    setStatusMessage("");

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
            void submitSerial(result.getText());
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

      if (detectedSerial) {
        await submitSerial(detectedSerial);
      } else {
        setErrorMessage("Could not find a serial number in the photo.");
      }
    } catch {
      setErrorMessage("Could not read the photo.");
    } finally {
      setIsReadingPhoto(false);
    }
  };

  return (
    <main className="scan-page">
      <header className="page-header">
        <p className="page-tag">Phone Scanner</p>
        <h1>Scan Device</h1>
        <p>Scan the Apple box with your iPhone and send the serial back to AssetFlow.</p>
      </header>

      <section className="scan-card">
        <div className="scan-panel">
          <h2>Camera</h2>
          <video
            ref={videoRef}
            className={isScanning ? "scanner-video" : "scanner-video hidden"}
          />
          <div className="button-row">
            <button type="button" onClick={startScanner} disabled={isScanning}>
              {isScanning ? "Scanning..." : "Start Camera"}
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
          <p className="helper-text">Use this if the barcode is hard to scan.</p>
        </div>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        {statusMessage ? <p className="status-text">{statusMessage}</p> : null}

        {ocrText ? (
          <details className="ocr-details">
            <summary>OCR text</summary>
            <pre>{ocrText}</pre>
          </details>
        ) : null}
      </section>
    </main>
  );
}
