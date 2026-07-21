import { useRef, useState } from "react";
import { BarcodeFormat, BrowserMultiFormatReader } from "@zxing/browser";
import { useParams } from "react-router-dom";

import { completeScanSession } from "../../services/scanSessions";
import "./ScanPhone.css";

export default function ScanPhone() {
  const { sessionId } = useParams();
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);

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

    setStatusMessage("Serial sent successfully.");
  };

  const startScanner = async () => {
    setErrorMessage("");
    setStatusMessage("");

    if (!videoRef.current) {
      setErrorMessage("Camera is not ready yet.");
      return;
    }

    setIsScanning(true);

    try {
      const reader = new BrowserMultiFormatReader();
      reader.possibleFormats = [
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.QR_CODE,
      ];

      const result = await reader.decodeOnceFromVideoDevice(
        undefined,
        videoRef.current
      );

      await submitSerial(result.getText());
    } catch {
      setErrorMessage("Could not read the serial barcode.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <main className="scan-page">
      <header className="page-header">
        <p className="page-tag">Phone Scanner</p>
        <h1>Scan Serial Number</h1>
        <p>
          Align the <strong>(S) Serial No.</strong> label inside the guide.
        </p>
      </header>

      <section className="scan-card">
        <div className="scan-panel scan-panel-camera">
          <div className="scan-panel-header">
            <h2>Scan Serial Number</h2>
            <p>Point your iPhone at the serial label and barcode.</p>
          </div>

          <div className={isScanning ? "camera-stage active" : "camera-stage"}>
            <video
              ref={videoRef}
              className={isScanning ? "scanner-video active" : "scanner-video"}
            />
            <div className="scan-guide">
              <div className="scan-guide-label">(S) Serial No.</div>
            </div>
          </div>

          <div className="scan-instructions">
            <p>Keep the barcode centered inside the guide.</p>
            <p>The scan stops automatically when it finds the serial.</p>
          </div>

          <div className="button-row">
            <button
              type="button"
              onClick={startScanner}
              disabled={isScanning}
              className="primary-scan-button"
            >
              {isScanning ? "Scanning..." : "📷 Scan Serial Number"}
            </button>
          </div>
        </div>

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        {statusMessage ? <p className="status-text">{statusMessage}</p> : null}
      </section>
    </main>
  );
}
