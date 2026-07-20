import "./App.css";

type ActionCardProps = {
  title: string;
  description: string;
  primaryLabel: string;
  secondaryLabel?: string;
};

function ActionCard({
  title,
  description,
  primaryLabel,
  secondaryLabel,
}: ActionCardProps) {
  return (
    <section className="card">
      <p className="card-label">{title}</p>
      <p className="card-description">{description}</p>
      <div className="button-row">
        <button type="button">{primaryLabel}</button>
        {secondaryLabel ? (
          <button type="button" className="secondary">
            {secondaryLabel}
          </button>
        ) : null}
      </div>
    </section>
  );
}

function App() {
  return (
    <div className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">AssetFlow</p>
          <h1>Freshservice Asset Management</h1>
          <p className="subtitle">
            Inventory and device assignment for Wolt Finland.
          </p>
        </div>
      </header>

      <main className="content">
        <section className="card card-wide">
          <p className="card-label">Inventory</p>
          <h2>Create assets</h2>
          <p className="card-description">
            Import shipment invoices in bulk or add a single device manually when there is no invoice.
          </p>

          <div className="grid-2">
            <ActionCard
              title="Import Shipment"
              description="Upload an invoice and create multiple stock assets from model and serial numbers."
              primaryLabel="Upload Invoice"
            />

            <ActionCard
              title="Add Single Asset"
              description="Enter a model and serial number manually for devices without an invoice."
              primaryLabel="Add Manually"
              secondaryLabel="Scan / OCR"
            />
          </div>
        </section>

        <section className="card">
          <p className="card-label">Deployment</p>
          <h2>Assign device</h2>
          <p className="card-description">
            Update an existing stock device, assign a user, and mark it as in use.
          </p>
          <div className="button-row">
            <button type="button">Assign Device</button>
          </div>
        </section>

        <section className="card">
          <p className="card-label">Settings</p>
          <h2>Catalog and defaults</h2>
          <p className="card-description">
            Manage device models, cost, storage, location, and Freshservice rules.
          </p>
          <div className="button-row">
            <button type="button" className="secondary">
              Open Settings
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
