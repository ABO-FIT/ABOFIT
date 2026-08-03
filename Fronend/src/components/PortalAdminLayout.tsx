import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/brand/logo-onlight.png";

const ENLACES = [
  { to: "/admin/panel", label: "Panel" },
  { to: "/admin/usuarios", label: "Usuarios" },
  { to: "/admin/gimnasios", label: "Gimnasios" },
  { to: "/admin/catalogo", label: "Catálogo" },
  { to: "/admin/planes", label: "Planes" },
  { to: "/admin/pedidos", label: "Pedidos" },
  { to: "/admin/facturas", label: "Facturas" },
  { to: "/admin/reportes", label: "Reportes" },
  { to: "/admin/auditoria", label: "Auditoría" },
  { to: "/perfil", label: "Mi Perfil" },
];

export default function PortalAdminLayout() {
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
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <img src={logo} alt="ABOFIT" style={{ height: 32 }} />

        <nav style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {ENLACES.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              style={({ isActive }) => ({
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 14,
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
