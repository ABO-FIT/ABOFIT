import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/brand/logo-onlight.png";

const ENLACES = [
  { to: "/portal/mi-plan", label: "Mi Plan" },
  { to: "/portal/mis-rutinas", label: "Mis Rutinas" },
  { to: "/portal/mi-progreso", label: "Mi Progreso" },
  { to: "/portal/contacto", label: "Contacto" },
  { to: "/portal/catalogo", label: "Catálogo" },
  { to: "/portal/carrito", label: "Carrito" },
  { to: "/portal/pedidos", label: "Mis Pedidos" },
  { to: "/portal/facturas", label: "Mis Facturas" },
  { to: "/perfil", label: "Mi Perfil" },
];

export default function PortalClienteLayout() {
  const { cerrarSesion, usuario } = useAuth();

  return (
    <div>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 24px",
          background: "var(--card)",
          borderBottom: "1px solid var(--line)",
        }}
      >
        <img src={logo} alt="ABOFIT" style={{ height: 32 }} />

        <nav style={{ display: "flex", gap: 16 }}>
          {ENLACES.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              style={({ isActive }) => ({
                textDecoration: "none",
                fontWeight: 600,
                color: isActive ? "var(--accent2)" : "var(--muted)",
              })}
            >
              {enlace.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 14, color: "var(--muted)" }}>{usuario?.nombre}</span>
          <button type="button" className="secondary" onClick={cerrarSesion}>
            Salir
          </button>
        </div>
      </header>

      <Outlet />
    </div>
  );
}
