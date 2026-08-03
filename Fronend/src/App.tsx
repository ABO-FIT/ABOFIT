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
import Panel from "./pages/entrenador/Panel";
import MisClientes from "./pages/entrenador/MisClientes";
import ClienteDetalle from "./pages/entrenador/ClienteDetalle";
import Mensajes from "./pages/entrenador/Mensajes";
import Catalogo from "./pages/shop/Catalogo";
import Carrito from "./pages/shop/Carrito";
import MisPedidos from "./pages/shop/MisPedidos";
import MisFacturas from "./pages/shop/MisFacturas";
import RutaProtegida from "./components/RutaProtegida";
import PortalClienteLayout from "./components/PortalClienteLayout";
import PortalEntrenadorLayout from "./components/PortalEntrenadorLayout";

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
        <Route path="catalogo" element={<Catalogo />} />
        <Route path="carrito" element={<Carrito />} />
        <Route path="pedidos" element={<MisPedidos />} />
        <Route path="facturas" element={<MisFacturas />} />
      </Route>

      <Route
        path="/entrenador"
        element={
          <RutaProtegida rol="Entrenador">
            <PortalEntrenadorLayout />
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate to="panel" replace />} />
        <Route path="panel" element={<Panel />} />
        <Route path="clientes" element={<MisClientes />} />
        <Route path="clientes/:id" element={<ClienteDetalle />} />
        <Route path="mensajes" element={<Mensajes />} />
        <Route path="catalogo" element={<Catalogo />} />
        <Route path="carrito" element={<Carrito />} />
        <Route path="pedidos" element={<MisPedidos />} />
        <Route path="facturas" element={<MisFacturas />} />
      </Route>
    </Routes>
  );
}
