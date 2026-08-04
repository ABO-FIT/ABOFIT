import SidebarLayout, { type EnlaceNav } from "./SidebarLayout";

const ENLACES: EnlaceNav[] = [
  { to: "/admin/panel", label: "Panel", icon: "▣" },
  { to: "/admin/usuarios", label: "Usuarios", icon: "◉" },
  { to: "/admin/gimnasios", label: "Gym", icon: "◫" },
  { to: "/admin/catalogo", label: "Suplementos", icon: "▦" },
  { to: "/admin/planes", label: "Planes", icon: "▤" },
  { to: "/admin/pedidos", label: "Pedidos", icon: "▣" },
  { to: "/admin/facturas", label: "Facturas", icon: "▤" },
  { to: "/admin/reportes", label: "Reportes", icon: "▲" },
  { to: "/admin/auditoria", label: "Auditoría", icon: "⚙" },
  { to: "/admin/configuracion", label: "Configuración", icon: "⚙" },
  { to: "/admin/perfil", label: "Perfil", icon: "☺" },
];

export default function PortalAdminLayout() {
  return <SidebarLayout enlaces={ENLACES} />;
}
