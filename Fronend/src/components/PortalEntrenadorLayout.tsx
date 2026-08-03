import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/brand/logo-onlight.png";

const ENLACES = [
  { to: "/entrenador/panel", label: "Panel" },
  { to: "/entrenador/clientes", label: "Mis Clientes" },
  { to: "/entrenador/mensajes", label: "Mensajes" },
  { to: "/perfil", label: "Mi Perfil" },
];

export default function PortalEntrenadorLayout() {
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
