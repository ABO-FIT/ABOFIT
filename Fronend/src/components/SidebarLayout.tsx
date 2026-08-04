import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import logo from "../assets/brand/logo.png";
import NotificationBell from "./NotificationBell";

export interface EnlaceNav {
  to: string;
  label: string;
  icon: string;
}

export default function SidebarLayout({ enlaces }: { enlaces: EnlaceNav[] }) {
  const { cerrarSesion, usuario } = useAuth();
  const { cantidad } = useCart();
  const location = useLocation();
  const base = location.pathname.split("/").slice(0, 2).join("/");

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="ABOFIT" />
          <span className="brand-sub">Training System</span>
        </div>

        <nav className="sidebar-nav">
          {enlaces.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span className="ic" aria-hidden="true">{enlace.icon}</span>
              {enlace.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <p className="name">{usuario?.nombre} {usuario?.apellido}</p>
          <p className="role">{usuario?.rol}</p>
          <button type="button" className="secondary" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <div className="content-area">
        <div className="topbar">
          <NotificationBell />
          {(base === "/portal" || base === "/entrenador") && (
            <Link to={`${base}/carrito`} className="top-icon" aria-label="Carrito" style={{ position: "relative" }}>
              <CartSVG />
              {cantidad > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -6,
                    background: "var(--accent2)",
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1,
                    padding: "3px 6px",
                    minWidth: 16,
                    textAlign: "center",
                  }}
                >
                  {cantidad}
                </span>
              )}
            </Link>
          )}
        </div>
        <Outlet />
      </div>
    </div>
  );
}

function CartSVG() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
