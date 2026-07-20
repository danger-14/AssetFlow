import "./App.css";

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">AssetFlow</p>
          <h1>Freshservice Asset Management</h1>
          <p className="subtitle">
            Inventory and device assignment for Wolt Finland.
          </p>
        </div>
      </header>

      <main className="grid">
        <section className="card">
          <p className="card-label">Inventory</p>
          <h2>Manage incoming devices</h2>
          <p className="card-text">
            Add shipment items or create a single asset manually when there is no invoice.
          </p>
          <div className="button-row">
            <button>Import Shipment</button>
            <button className="secondary">Add Single Asset</button>
          </div>
        </section>

        <section className="card">
          <p className="card-label">Deployment</p>
          <h2>Assign device to a user</h2>
          <p className="card-text">
            Update an existing stock device and mark it as in use.
          </p>
          <div className="button-row">
            <button>Assign Device</button>
          </div>
        </section>

        <section className="card full-width">
          <p className="card-label">Settings</p>
          <h2>Device catalog and defaults</h2>
          <p className="card-text">
            Manage device models, default costs, storage, location, and Freshservice rules.
          </p>
          <div className="button-row">
            <button className="secondary">Open Settings</button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
