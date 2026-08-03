import { Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import OlvidePassword from "./pages/OlvidePassword";
import EstablecerPassword from "./pages/EstablecerPassword";
import Perfil from "./pages/Perfil";
import MiPlan from "./pages/portal/MiPlan";
import MisRutinas from "./pages/portal/MisRutinas";
import MiProgreso from "./pages/portal/MiProgreso";
import ContactoEntrenador from "./pages/portal/ContactoEntrenador";
import RutaProtegida from "./components/RutaProtegida";
import PortalClienteLayout from "./components/PortalClienteLayout";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/olvide-password" element={<OlvidePassword />} />
      <Route path="/establecer-password" element={<EstablecerPassword />} />
      <Route
        path="/perfil"
        element={
          <RutaProtegida>
            <Perfil />
          </RutaProtegida>
        }
      />

      <Route
        path="/portal"
        element={
          <RutaProtegida rol="Cliente">
            <PortalClienteLayout />
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate to="mi-plan" replace />} />
        <Route path="mi-plan" element={<MiPlan />} />
        <Route path="mis-rutinas" element={<MisRutinas />} />
        <Route path="mi-progreso" element={<MiProgreso />} />
        <Route path="contacto" element={<ContactoEntrenador />} />
      </Route>
    </Routes>
  );
}
