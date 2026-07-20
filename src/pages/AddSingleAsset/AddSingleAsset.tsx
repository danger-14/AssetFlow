import "./AddSingleAsset.css";
import { deviceCatalog } from "../../data/deviceCatalog";

export default function AddSingleAsset() {
  return (
    <main className="single-page">
      <header className="page-header">
        <p className="page-tag">Inventory</p>
        <h1>Add Single Asset</h1>
        <p>Create a new asset manually when there is no shipment invoice.</p>
      </header>

      <section className="asset-form">
        <div className="form-group">
          <label htmlFor="product">Product</label>
          <select id="product" defaultValue="">
            <option value="" disabled>
              Select Product
            </option>
            {deviceCatalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.product}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="serial">Serial Number</label>
          <input id="serial" placeholder="Enter Serial Number" />
        </div>

        <div className="scan-buttons">
          <button type="button">Scan Barcode</button>
          <button type="button">Scan OCR</button>
        </div>

        <button type="button" className="create-button">
          Create Asset
        </button>
      </section>
    </main>
  );
}
