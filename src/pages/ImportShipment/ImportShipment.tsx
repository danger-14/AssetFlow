import { useMemo, useState } from "react";
import {
  createManualShipmentDevice,
  extractPdfText,
  parseShipmentDevicesFromText,
} from "../../utils/importShipment";
import type { ShipmentDevice } from "../../types/importShipment";
import { saveShipmentDevices } from "../../services/inventory";
import "./ImportShipment.css";

export default function ImportShipment() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualSerial, setManualSerial] = useState("");
  const [manualModel, setManualModel] = useState("");
  const [devices, setDevices] = useState<ShipmentDevice[]>([]);
  const [isReading, setIsReading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const fileName = useMemo(() => {
    if (!selectedFile) return "No file selected";
    return selectedFile.name;
  }, [selectedFile]);

  const selectedCount = useMemo(
    () => devices.filter((device) => device.selected).length,
    [devices]
  );

  const toggleDevice = (id: string) => {
    setDevices((current) =>
      current.map((device) =>
        device.id === id ? { ...device, selected: !device.selected } : device
      )
    );
  };

  const handlePreview = async () => {
    setError("");
    setSuccessMessage("");
    setDevices([]);

    try {
      setIsReading(true);

      const nextDevices: ShipmentDevice[] = [];

      if (selectedFile) {
        const pdfText = await extractPdfText(selectedFile);
        nextDevices.push(...parseShipmentDevicesFromText(pdfText));
      }

      const manualDevice = createManualShipmentDevice(manualModel, manualSerial);
      if (manualDevice) {
        nextDevices.push(manualDevice);
      }

      if (nextDevices.length === 0) {
        setError("Upload a PDF or enter a manual model and serial number.");
        return;
      }

      setDevices(nextDevices);
    } catch {
      setError("Could not read the PDF. Please try another file.");
    } finally {
      setIsReading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setManualSerial("");
    setManualModel("");
    setDevices([]);
    setError("");
    setSuccessMessage("");
  };

  const handleCreateAssets = async () => {
    setError("");
    setSuccessMessage("");

    const selectedDevices = devices.filter((device) => device.selected);

    if (selectedDevices.length === 0) {
      setError("Select at least one device before creating assets.");
      return;
    }

    try {
      setIsSaving(true);
      const result = await saveShipmentDevices(selectedDevices);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccessMessage(`${result.saved} device(s) saved to Supabase.`);
    } catch {
      setError("Could not save the devices.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="import-page">
      <header className="page-header">
        <p className="page-tag">Inventory</p>
        <h1>Import Shipment</h1>
        <p>
          Upload a PDF invoice to extract the model name and serial number.
        </p>
      </header>

      <section className="import-card">
        <div className="form-group">
          <label htmlFor="invoice">Invoice PDF</label>
          <input
            id="invoice"
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
          />
          <p className="helper-text">{fileName}</p>
        </div>

        <div className="form-group">
          <label htmlFor="manual-serial">Manual Serial Number</label>
          <input
            id="manual-serial"
            type="text"
            placeholder="Optional fallback when invoice is unavailable"
            value={manualSerial}
            onChange={(e) => setManualSerial(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="manual-model">Manual Model</label>
          <input
            id="manual-model"
            type="text"
            placeholder="Enter product model manually"
            value={manualModel}
            onChange={(e) => setManualModel(e.target.value)}
          />
        </div>

        <div className="button-row">
          <button type="button" onClick={handlePreview} disabled={isReading}>
            {isReading ? "Reading PDF..." : "Preview Import"}
          </button>
          <button type="button" className="secondary" onClick={handleClear}>
            Clear
          </button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
        {successMessage ? <p className="status-text">{successMessage}</p> : null}

        {devices.length > 0 ? (
          <section className="preview">
            <div className="preview-header">
              <div>
                <h2>Extracted Devices</h2>
                <p className="helper-text">
                  {selectedCount} selected of {devices.length} found
                </p>
              </div>

              <button
                type="button"
                className="secondary"
                onClick={() =>
                  setDevices((current) =>
                    current.map((device) => ({ ...device, selected: true }))
                  )
                }
              >
                Select All
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th />
                    <th>Model</th>
                    <th>Serial</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map((device) => (
                    <tr key={device.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={device.selected}
                          onChange={() => toggleDevice(device.id)}
                        />
                      </td>
                      <td>{device.model}</td>
                      <td>{device.serial}</td>
                      <td>{device.source === "pdf" ? "PDF" : "Manual"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="preview-actions">
              <button
                type="button"
                disabled={selectedCount === 0 || isSaving}
                onClick={handleCreateAssets}
              >
                {isSaving ? "Saving..." : "Create Assets"}
              </button>
            </div>
          </section>
        ) : null}
      </section>
    </main>
  );
}
