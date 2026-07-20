import "./AssignDevice.css";
import { deviceCatalog } from "../../data/deviceCatalog";

export default function AssignDevice() {
  return (
    <main className="assign-page">
      <header className="page-header">
        <p className="page-tag">Deployment</p>
        <h1>Assign Device</h1>
        <p>
          Assign an existing stock asset to a user and mark it as in use.
        </p>
      </header>

      <section className="assign-card">
        <div className="form-group">
          <label htmlFor="asset">Asset</label>
          <select id="asset" defaultValue="">
            <option value="" disabled>
              Select Asset
            </option>
            {deviceCatalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.product}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="user">Used By</label>
          <input id="user" type="text" placeholder="Enter user name" />
        </div>

        <div className="form-group">
          <label htmlFor="department">Department</label>
          <input id="department" type="text" value="All Wolt" readOnly />
        </div>

        <div className="form-group">
          <label htmlFor="state">Asset State</label>
          <input id="state" type="text" value="In Use" readOnly />
        </div>

        <button type="button" className="assign-button">
          Assign Device
        </button>
      </section>
    </main>
  );
}
