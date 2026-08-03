import { Navigate, Route, Routes } from "react-router-dom";
import Registro from "./pages/Registro";
import EstablecerPassword from "./pages/EstablecerPassword";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/registro" replace />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/establecer-password" element={<EstablecerPassword />} />
    </Routes>
  );
}
