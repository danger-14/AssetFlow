import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { deviceCatalog } from "../../data/deviceCatalog";
import { getInventoryBySerial, saveAssignment } from "../../services/inventory";
import { createScanSession, getScanSession } from "../../services/scanSessions";
import {
  normalizeSerial,
  type DeviceCatalogItem,
} from "../../utils/deviceIdentification";
import "./AssignDevice.css";

type MatchedInventory = {
  serial: string;
  model: string;
  status: string;
  source: string;
  used_by: string | null;
};

function getScannerUrl(sessionId: string) {
  return `${window.location.origin}/scan/${sessionId}`;
}

export default function AssignDevice() {
  const [serialNumber, setSerialNumber] = useState("");
  const [usedByEmail, setUsedByEmail] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [matchedInventory, setMatchedInventory] = useState<MatchedInventory | null>(null);
  const [needsManualModel, setNeedsManualModel] = useState(false);
  const [scanSessionId, setScanSessionId] = useState("");
  const [isCreatingScanSession, setIsCreatingScanSession] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const lastSessionSerialRef = useRef("");

  const selectedModel: DeviceCatalogItem | null = useMemo(
    () => deviceCatalog.find((item) => item.id === selectedModelId) ?? null,
    [selectedModelId]
  );

  const resolvedModelText = matchedInventory?.model || selectedModel?.product || "";
  const scannerUrl = scanSessionId ? getScannerUrl(scanSessionId) : "";
  const scannerQrUrl = scannerUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
        scannerUrl
      )}`
    : "";

  const lookupSerial = useCallback(async (rawSerial: string) => {
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
        setMatchedInventory({
          serial: device.serial,
          model: device.model,
          status: device.status,
          source: device.source,
          used_by: device.used_by,
        });
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
  }, []);

  useEffect(() => {
    if (!scanSessionId) return;

    let active = true;

    const pollSession = async () => {
      try {
        const session = await getScanSession(scanSessionId);
        if (!active || !session?.serial) return;

        const serial = normalizeSerial(session.serial);

        if (!serial || serial === lastSessionSerialRef.current) return;

        lastSessionSerialRef.current = serial;
        setSerialNumber(serial);
        setStatusMessage("Serial received from iPhone.");
        await lookupSerial(serial);
      } catch {
        // ignore polling errors
      }
    };

    void pollSession();
    const timer = window.setInterval(() => {
      void pollSession();
    }, 1200);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [scanSessionId, lookupSerial]);

  const createPhoneScanSession = async () => {
    setErrorMessage("");
    setStatusMessage("");

    const sessionId = crypto.randomUUID();
    setIsCreatingScanSession(true);

    try {
      const result = await createScanSession(sessionId);

      if (!result.ok) {
        setErrorMessage(result.error);
        return;
      }

      lastSessionSerialRef.current = "";
      setScanSessionId(sessionId);
      setStatusMessage("Open the QR code with your iPhone.");
    } finally {
      setIsCreatingScanSession(false);
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

      setMatchedInventory({
        serial,
        model,
        status: "Assigned",
        source: matchedInventory?.source || "Manual",
        used_by: usedBy,
      });
      setStatusMessage(`Ready: ${model} / ${serial} / ${usedBy}`);
    } catch {
      setErrorMessage("Could not save the assignment.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClear = () => {
    setScanSessionId("");
    lastSessionSerialRef.current = "";
    setSerialNumber("");
    setUsedByEmail("");
    setSelectedModelId("");
    setMatchedInventory(null);
    setNeedsManualModel(false);
    setStatusMessage("");
    setErrorMessage("");
  };

  return (
    <main className="assign-page">
      <header className="page-header">
        <p className="page-tag">Deployment</p>
        <h1>Assign Device</h1>
        <p>Use your iPhone to scan the box, then assign the device by email.</p>
      </header>

      <section className="assign-card">
        <div className="scanner-launch">
          <div>
            <h2>Scan with iPhone</h2>
            <p className="helper-text">
              Open the scanner on your phone, scan the box, and send the serial back here.
            </p>
          </div>

          <button type="button" onClick={createPhoneScanSession} disabled={isCreatingScanSession}>
            {isCreatingScanSession ? "Creating..." : "Scan with iPhone"}
          </button>
        </div>

        {scannerUrl ? (
          <div className="phone-scanner">
            <img src={scannerQrUrl} alt="Scan with iPhone" />
            <div className="phone-scanner-copy">
              <p className="helper-text">Open this on your phone:</p>
              <a href={scannerUrl} target="_blank" rel="noreferrer">
                {scannerUrl}
              </a>
            </div>
          </div>
        ) : null}

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
