import "./ImportShipment.css";

export default function ImportShipment() {
  return (
    <main className="import-page">
      <header className="page-header">
        <p className="page-tag">Inventory</p>
        <h1>Import Shipment</h1>
        <p>
          Upload an invoice to create multiple stock assets from the model and serial numbers.
        </p>
      </header>

      <section className="import-card">
        <div className="form-group">
          <label htmlFor="invoice">Invoice File</label>
          <input id="invoice" type="file" />
        </div>

        <div className="form-group">
          <label htmlFor="manual-serial">Manual Serial Number</label>
          <input id="manual-serial" type="text" placeholder="Optional fallback when invoice is unavailable" />
        </div>

        <div className="form-group">
          <label htmlFor="manual-model">Manual Model</label>
          <input id="manual-model" type="text" placeholder="Enter product model manually" />
        </div>

        <div className="button-row">
          <button type="button">Preview Import</button>
          <button type="button" className="secondary">
            Create Assets
          </button>
        </div>
      </section>
    </main>
  );
}
