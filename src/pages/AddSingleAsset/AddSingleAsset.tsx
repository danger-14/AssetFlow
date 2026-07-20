import "./AddSingleAsset.css";

export default function AddSingleAsset() {
  return (
    <main className="single-page">

      <header className="page-header">
        <p className="page-tag">
          Inventory
        </p>

        <h1>Add Single Asset</h1>

        <p>
          Create a new asset manually when there is no shipment invoice.
        </p>
      </header>

      <section className="asset-form">

        <div className="form-group">
          <label>Product</label>

          <select>

            <option>
              Select Product
            </option>

          </select>
        </div>

        <div className="form-group">

          <label>
            Serial Number
          </label>

          <input
            placeholder="Enter Serial Number"
          />

        </div>

        <div className="scan-buttons">

          <button>

            Scan Barcode

          </button>

          <button>

            Scan OCR

          </button>

        </div>

        <button className="create-button">

          Create Asset

        </button>

      </section>

    </main>
  );
}
