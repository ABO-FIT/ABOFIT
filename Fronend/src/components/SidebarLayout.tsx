import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/brand/logo.png";
import NotificationBell from "./NotificationBell";

export interface EnlaceNav {
  to: string;
  label: string;
  icon: string;
}

export default function SidebarLayout({ enlaces }: { enlaces: EnlaceNav[] }) {
  const { cerrarSesion, usuario } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src={logo} alt="ABOFIT" />
        </div>

        <nav className="sidebar-nav">
          {enlaces.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              <span aria-hidden="true">{enlace.icon}</span>
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
        <div className="content-topbar">
          <NotificationBell />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
