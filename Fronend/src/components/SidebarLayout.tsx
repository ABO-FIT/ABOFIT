import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import logo from "../assets/brand/logo.png";
import NotificationBell from "./NotificationBell";

export interface EnlaceHijo {
  to: string;
  label: string;
}

export interface EnlaceNav {
  to?: string;
  label: string;
  icon: string;
  hijos?: EnlaceHijo[];
}

export default function SidebarLayout({ enlaces }: { enlaces: EnlaceNav[] }) {
  const { cerrarSesion, usuario } = useAuth();
  const { cantidad } = useCart();
  const location = useLocation();
  const base = location.pathname.split("/").slice(0, 2).join("/");

  const grupoActivoPorRuta = enlaces.find((e) => e.hijos?.some((h) => location.pathname.startsWith(h.to)))?.label ?? null;
  const [grupoAbierto, setGrupoAbierto] = useState<string | null>(grupoActivoPorRuta);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    if (grupoActivoPorRuta) setGrupoAbierto(grupoActivoPorRuta);
  }, [grupoActivoPorRuta]);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  function toggleGrupo(label: string) {
    setGrupoAbierto((actual) => (actual === label ? null : label));
  }

  return (
    <div className="app-shell">
      <div className={`sidebar-overlay ${menuAbierto ? "open" : ""}`} onClick={() => setMenuAbierto(false)} />
      <aside className={`sidebar ${menuAbierto ? "open" : ""}`}>
        <div className="sidebar-logo">
          <img src={logo} alt="ABOFIT" />
          <span className="brand-sub">Training System</span>
        </div>

        <nav className="sidebar-nav">
          {enlaces.map((enlace) =>
            enlace.hijos ? (
              <div key={enlace.label}>
                <button
                  type="button"
                  className="sidebar-group-toggle"
                  onClick={() => toggleGrupo(enlace.label)}
                >
                  <span className="ic" aria-hidden="true">{enlace.icon}</span>
                  <span style={{ flex: 1, textAlign: "left" }}>{enlace.label}</span>
                  <span className="chev">{grupoAbierto === enlace.label ? "⌃" : "⌄"}</span>
                </button>
                {grupoAbierto === enlace.label && (
                  <div className="sidebar-subnav">
                    {enlace.hijos.map((hijo) => (
                      <NavLink key={hijo.to} to={hijo.to} className={({ isActive }) => (isActive ? "active" : "")}>
                        {hijo.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={enlace.to}
                to={enlace.to as string}
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                <span className="ic" aria-hidden="true">{enlace.icon}</span>
                {enlace.label}
              </NavLink>
            )
          )}
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
          <button type="button" className="menu-toggle" aria-label="Abrir menú" onClick={() => setMenuAbierto((v) => !v)}>
            <MenuSVG />
          </button>
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

function MenuSVG() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
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
