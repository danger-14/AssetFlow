import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Inventory from "./pages/Inventory/Inventory";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/inventory" replace />} />
        <Route path="/inventory" element={<Inventory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
