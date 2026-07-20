import "./AddSingleAsset.css";

export default function AddSingleAsset() {
  return (
    <div className="single-asset-page">
      <div className="page-header">
        <h1>Add Single Asset</h1>
        <p>Create a new asset manually when there is no shipment invoice.</p>
      </div>

      <form className="asset-form">
        <div className="form-group">
          <label>Product</label>

          <select>
            <option>Select a product...</option>
          </select>
        </div>

        <div className="form-group">
          <label>Serial Number</label>

          <input
            type="text"
            placeholder="Enter serial number..."
          />
        </div>

        <div className="form-actions">
          <button type="button">
            Scan Barcode
          </button>

          <button type="button">
            Scan OCR
          </button>

          <button type="submit">
            Create Asset
          </button>
        </div>
      </form>
    </div>
  );
}
