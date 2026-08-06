import SidebarLayout, { type EnlaceNav } from "./SidebarLayout";

const ENLACES: EnlaceNav[] = [
  { to: "/entrenador/panel", label: "Panel", icon: "▣" },
  { to: "/entrenador/alertas", label: "Alertas", icon: "!" },
  { to: "/entrenador/reportes", label: "Reportes", icon: "▲" },
  { to: "/entrenador/clientes", label: "Mis Clientes", icon: "◉" },
  { to: "/entrenador/planes", label: "Mis Planes", icon: "◆" },
  { to: "/entrenador/catalogo", label: "Suplementos", icon: "▦" },
  { to: "/entrenador/carrito", label: "Carrito", icon: "▣" },
  { to: "/entrenador/pedidos", label: "Mis pedidos", icon: "▣" },
  { to: "/entrenador/facturas", label: "Mis facturas", icon: "▤" },
  { to: "/entrenador/mensajes", label: "Mensajes", icon: "✉" },
  { to: "/entrenador/perfil", label: "Perfil", icon: "☺" },
];

export default function PortalEntrenadorLayout() {
  return <SidebarLayout enlaces={ENLACES} />;
}
