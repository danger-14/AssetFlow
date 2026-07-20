import "./Inventory.css";

export default function Inventory() {
  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <p className="page-tag">Inventory</p>
          <h1>Inventory Management</h1>
          <p className="page-description">
            Create new assets by importing a shipment invoice or by adding a
            single device manually.
          </p>
        </div>
      </div>

      <div className="inventory-grid">
        <div className="inventory-card">
          <h2>Import Shipment</h2>

          <p>
            Import multiple devices from a supplier invoice. AssetFlow will
            extract the model and serial numbers, validate duplicates and create
            Stock assets inside Freshservice.
          </p>

          <button>Upload Invoice</button>
        </div>

        <div className="inventory-card">
          <h2>Add Single Asset</h2>

          <p>
            Create a single asset manually when an invoice is unavailable.
          </p>

          <button>Add Asset</button>
        </div>
      </div>
    </div>
  );
}
