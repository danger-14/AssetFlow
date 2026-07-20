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
        <section className="card full-width">
          <p className="card-label">Inventory</p>
          <div className="section-header">
            <div>
              <h2>Create assets</h2>
              <p className="card-text">
                Use an invoice for batch imports, or add a single device manually when there is no invoice.
              </p>
            </div>
          </div>

          <div className="two-column">
            <div className="subcard">
              <h3>Import Shipment</h3>
              <p>
                Upload an invoice and create multiple stock assets from the model and serial numbers.
              </p>
              <button>Upload Invoice</button>
            </div>

            <div className="subcard">
              <h3>Add Single Asset</h3>
              <p>
                Enter a model and serial number manually for devices without an invoice.
              </p>
              <button className="secondary">Add Manually</button>
            </div>
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

        <section className="card">
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
