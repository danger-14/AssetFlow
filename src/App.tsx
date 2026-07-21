import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Inventory from "./pages/Inventory/Inventory";
import AddSingleAsset from "./pages/AddSingleAsset/AddSingleAsset";
import ImportShipment from "./pages/ImportShipment/ImportShipment";
import AssignDevice from "./pages/AssignDevice/AssignDevice";
import ScanPhone from "./pages/ScanPhone/ScanPhone";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inventory" replace />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/add" element={<AddSingleAsset />} />
        <Route path="/inventory/import" element={<ImportShipment />} />
        <Route path="/assign" element={<AssignDevice />} />
        <Route path="/scan/:sessionId" element={<ScanPhone />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
