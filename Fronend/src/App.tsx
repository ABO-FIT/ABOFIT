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
import PanelEntrenador from "./pages/entrenador/Panel";
import MisClientes from "./pages/entrenador/MisClientes";
import ClienteDetalle from "./pages/entrenador/ClienteDetalle";
import Mensajes from "./pages/entrenador/Mensajes";
import Catalogo from "./pages/shop/Catalogo";
import Carrito from "./pages/shop/Carrito";
import MisPedidos from "./pages/shop/MisPedidos";
import MisFacturas from "./pages/shop/MisFacturas";
import MisPagos from "./pages/portal/MisPagos";
import PanelAdmin from "./pages/admin/Panel";
import Usuarios from "./pages/admin/Usuarios";
import Gimnasios from "./pages/admin/Gimnasios";
import CatalogoAdmin from "./pages/admin/CatalogoAdmin";
import Planes from "./pages/admin/Planes";
import Pedidos from "./pages/admin/Pedidos";
import Facturas from "./pages/admin/Facturas";
import Reportes from "./pages/admin/Reportes";
import Auditoria from "./pages/admin/Auditoria";
import Configuracion from "./pages/admin/Configuracion";
import RutaProtegida from "./components/RutaProtegida";
import PortalClienteLayout from "./components/PortalClienteLayout";
import PortalEntrenadorLayout from "./components/PortalEntrenadorLayout";
import PortalAdminLayout from "./components/PortalAdminLayout";

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
        <Route path="pagos" element={<MisPagos />} />
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
        <Route path="panel" element={<PanelEntrenador />} />
        <Route path="clientes" element={<MisClientes />} />
        <Route path="clientes/:id" element={<ClienteDetalle />} />
        <Route path="mensajes" element={<Mensajes />} />
        <Route path="catalogo" element={<Catalogo />} />
        <Route path="carrito" element={<Carrito />} />
        <Route path="pedidos" element={<MisPedidos />} />
        <Route path="facturas" element={<MisFacturas />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RutaProtegida rol="Administrador">
            <PortalAdminLayout />
          </RutaProtegida>
        }
      >
        <Route index element={<Navigate to="panel" replace />} />
        <Route path="panel" element={<PanelAdmin />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="gimnasios" element={<Gimnasios />} />
        <Route path="catalogo" element={<CatalogoAdmin />} />
        <Route path="planes" element={<Planes />} />
        <Route path="pedidos" element={<Pedidos />} />
        <Route path="facturas" element={<Facturas />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="auditoria" element={<Auditoria />} />
        <Route path="configuracion" element={<Configuracion />} />
      </Route>
    </Routes>
  );
}
