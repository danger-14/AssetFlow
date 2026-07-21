import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { listInventory, type InventoryRow } from "../../services/inventory";
import "./Inventory.css";

function Inventory() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInventory = async () => {
    setIsLoading(true);
    setError("");

    try {
      const data = await listInventory();
      setRows(data);
    } catch {
      setError("Could not load inventory from Supabase.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInventory();
  }, []);

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

      <section className="inventory-list">
        <div className="inventory-list-header">
          <div>
            <h2>Supabase Inventory</h2>
            <p className="helper-text">
              Showing saved devices from the AssetFlow database.
            </p>
          </div>

          <button type="button" className="secondary" onClick={() => void loadInventory()}>
            Refresh
          </button>
        </div>

        {error ? <p className="error-text">{error}</p> : null}
        {isLoading ? <p className="helper-text">Loading inventory...</p> : null}

        {!isLoading && !error ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Serial</th>
                  <th>Model</th>
                  <th>Status</th>
                  <th>Source</th>
                  <th>Used By</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      No inventory found yet.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.serial}</td>
                      <td>{row.model}</td>
                      <td>{row.status}</td>
                      <td>{row.source}</td>
                      <td>{row.used_by || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </main>
  );
}

export default Inventory;
