import { BrowserRouter, Routes, Route } from "react-router-dom";

import Inventory from "./pages/Inventory/Inventory";
import AddSingleAsset from "./pages/AddSingleAsset/AddSingleAsset";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inventory />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/inventory/add" element={<AddSingleAsset />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
