import SidebarLayout, { type EnlaceNav } from "./SidebarLayout";

const ENLACES: EnlaceNav[] = [
  { to: "/admin/panel", label: "Panel", icon: "📊" },
  { to: "/admin/usuarios", label: "Usuarios", icon: "👤" },
  { to: "/admin/gimnasios", label: "Gimnasios", icon: "🏢" },
  { to: "/admin/catalogo", label: "Catálogo", icon: "💊" },
  { to: "/admin/planes", label: "Planes", icon: "📋" },
  { to: "/admin/pedidos", label: "Pedidos", icon: "📦" },
  { to: "/admin/facturas", label: "Facturas", icon: "🧾" },
  { to: "/admin/reportes", label: "Reportes", icon: "📈" },
  { to: "/admin/auditoria", label: "Auditoría", icon: "🛡️" },
  { to: "/perfil", label: "Mi Perfil", icon: "⚙️" },
];

export default function PortalAdminLayout() {
  return <SidebarLayout enlaces={ENLACES} />;
}
