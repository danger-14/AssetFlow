import { useEffect, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import { useParams } from "react-router-dom";

import { completeScanSession } from "../../services/scanSessions";
import { extractSerialFromText } from "../../utils/deviceIdentification";
import "./ScanPhone.css";

type BarcodeCandidate = { rawValue?: string | null };

function createGuideCropCanvas(
  video: HTMLVideoElement,
  stage: HTMLDivElement,
  guide: HTMLDivElement
) {
  const stageRect = stage.getBoundingClientRect();
  const guideRect = guide.getBoundingClientRect();

  const videoWidth = video.videoWidth;
  const videoHeight = video.videoHeight;

  if (!videoWidth || !videoHeight || !stageRect.width || !stageRect.height) {
    return null;
  }

  const scale = Math.max(
    stageRect.width / videoWidth,
    stageRect.height / videoHeight
  );

  const displayedWidth = videoWidth * scale;
  const displayedHeight = videoHeight * scale;

  const offsetX = (displayedWidth - stageRect.width) / 2;
  const offsetY = (displayedHeight - stageRect.height) / 2;

  const guideLeft = guideRect.left - stageRect.left;
  const guideTop = guideRect.top - stageRect.top;
  const guideWidth = guideRect.width;
  const guideHeight = guideRect.height;

  const sx = Math.max(0, Math.floor((guideLeft + offsetX) / scale));
  const sy = Math.max(0, Math.floor((guideTop + offsetY) / scale));
  const sw = Math.min(videoWidth - sx, Math.floor(guideWidth / scale));
  const sh = Math.min(videoHeight - sy, Math.floor(guideHeight / scale));

  if (sw <= 0 || sh <= 0) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = sw;
  canvas.height = sh;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

  return canvas;
}

export default function ScanPhone() {
  const { sessionId } = useParams();
  const [isScanning, setIsScanning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const guideRef = useRef<HTMLDivElement | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<any>(null);
  const scanTimerRef = useRef<number | null>(null);
  const scanAttemptsRef = useRef(0);
  const scanningRef = useRef(false);

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

  const stopScanner = () => {
    scanningRef.current = false;
    setIsScanning(false);

    if (scanTimerRef.current !== null) {
      window.clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    detectorRef.current = null;
    scanAttemptsRef.current = 0;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scheduleNextScan = () => {
    if (!scanningRef.current) return;

    scanTimerRef.current = window.setTimeout(() => {
      void scanFrame();
    }, 180);
  };

  const scanFrame = async () => {
    if (!scanningRef.current) return;

    const video = videoRef.current;
    const stage = stageRef.current;
    const guide = guideRef.current;

    if (
      !video ||
      !stage ||
      !guide ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      scheduleNextScan();
      return;
    }

    const cropCanvas = createGuideCropCanvas(video, stage, guide);

    if (!cropCanvas) {
      scheduleNextScan();
      return;
    }

    const detector: any = detectorRef.current;

    if (detector) {
      try {
        const results: BarcodeCandidate[] = await detector.detect(cropCanvas);
        const rawValue = results[0]?.rawValue ?? "";

        if (rawValue) {
          await submitSerial(rawValue);
          stopScanner();
          return;
        }
      } catch {
        // ignore and continue
      }
    }

    scanAttemptsRef.current += 1;

    if (scanAttemptsRef.current >= 10) {
      try {
        const result = await Tesseract.recognize(cropCanvas, "eng");
        const text = result.data.text ?? "";
        const serial = extractSerialFromText(text);

        if (serial) {
          await submitSerial(serial);
          stopScanner();
          return;
        }
      } catch {
        // ignore and fall through to error
      }

      setErrorMessage(
        "Serial number not detected. Please align the label inside the guide."
      );
      stopScanner();
      return;
    }

    scheduleNextScan();
  };

  const startScanner = async () => {
    setErrorMessage("");
    setStatusMessage("");

    if (!videoRef.current) {
      setErrorMessage("Camera is not ready yet.");
      return;
    }

    stopScanner();
    scanningRef.current = true;
    setIsScanning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
        },
        audio: false,
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      const BarcodeDetectorCtor = (window as Window & {
        BarcodeDetector?: new (options: { formats: string[] }) => any;
      }).BarcodeDetector;

      detectorRef.current = BarcodeDetectorCtor
        ? new BarcodeDetectorCtor({
            formats: ["code_128", "code_39", "qr_code"],
          })
        : null;

      scanAttemptsRef.current = 0;
      await scanFrame();
    } catch {
      setErrorMessage("Could not start the camera.");
      stopScanner();
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

          <div
            ref={stageRef}
            className={isScanning ? "camera-stage active" : "camera-stage"}
          >
            <video
              ref={videoRef}
              className={isScanning ? "scanner-video active" : "scanner-video"}
              playsInline
              muted
            />
            <div ref={guideRef} className="scan-guide">
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
