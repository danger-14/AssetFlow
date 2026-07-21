import { useNavigate } from "react-router-dom";
import "./Inventory.css";

function Inventory() {
  const navigate = useNavigate();

  return (
    <main className="inventory-page">
      <section className="inventory-hero">
        <p className="eyebrow">AssetFlow</p>
        <h1>Inventory</h1>
        <p className="subtitle">
          Create assets from a shipment invoice or add a single device manually.
        </p>
      </section>

      <section className="inventory-grid">
        <article className="inventory-card">
          <p className="card-label">Shipment</p>
          <h2>Import Shipment</h2>
          <p className="card-text">
            Upload an invoice and create stock assets from the model and serial numbers.
          </p>
          <button type="button" onClick={() => navigate("/inventory/import")}>
            Upload Invoice
          </button>
        </article>

        <article className="inventory-card">
          <p className="card-label">Manual</p>
          <h2>Add Single Asset</h2>
          <p className="card-text">
            Create one asset manually when there is no invoice available.
          </p>
          <button type="button" onClick={() => navigate("/inventory/add")}>
            Add Asset
          </button>
        </article>

        <article className="inventory-card">
          <p className="card-label">Deployment</p>
          <h2>Assign Device</h2>
          <p className="card-text">
            Assign an existing stock asset to a user and mark it as in use.
          </p>
          <button type="button" onClick={() => navigate("/assign")}>
            Assign Device
          </button>
        </article>
      </section>
    </main>
  );
}

export default Inventory;
