import SidebarLayout, { type EnlaceNav } from "./SidebarLayout";

const ENLACES: EnlaceNav[] = [
  { to: "/entrenador/panel", label: "Panel", icon: "📊" },
  { to: "/entrenador/clientes", label: "Mis Clientes", icon: "👥" },
  { to: "/entrenador/mensajes", label: "Mensajes", icon: "✉️" },
  { to: "/entrenador/catalogo", label: "Catálogo", icon: "🛒" },
  { to: "/entrenador/carrito", label: "Carrito", icon: "🧺" },
  { to: "/entrenador/pedidos", label: "Mis Pedidos", icon: "📦" },
  { to: "/entrenador/facturas", label: "Mis Facturas", icon: "🧾" },
  { to: "/perfil", label: "Mi Perfil", icon: "⚙️" },
];

export default function PortalEntrenadorLayout() {
  return <SidebarLayout enlaces={ENLACES} />;
}
