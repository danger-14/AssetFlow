import { useMemo, useState } from "react";
import "./ImportShipment.css";

function ImportShipment() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualSerial, setManualSerial] = useState("");
  const [manualModel, setManualModel] = useState("");

  const fileName = useMemo(() => {
    if (!selectedFile) return "No file selected";
    return selectedFile.name;
  }, [selectedFile]);

  return (
    <main className="import-page">
      <header className="page-header">
        <p className="page-tag">Inventory</p>
        <h1>Import Shipment</h1>
        <p>
          Upload a PDF invoice to create stock assets from the model and serial
          numbers.
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
          <button type="button">Preview Import</button>
          <button type="button" className="secondary">
            Clear
          </button>
        </div>
      </section>
    </main>
  );
}

export default ImportShipment;
