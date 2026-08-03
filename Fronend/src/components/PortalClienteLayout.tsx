import SidebarLayout, { type EnlaceNav } from "./SidebarLayout";

const ENLACES: EnlaceNav[] = [
  { to: "/portal/mi-plan", label: "Mi Plan", icon: "📋" },
  { to: "/portal/mis-rutinas", label: "Mis Rutinas", icon: "🏋️" },
  { to: "/portal/mi-progreso", label: "Mi Progreso", icon: "📈" },
  { to: "/portal/contacto", label: "Contacto", icon: "✉️" },
  { to: "/portal/catalogo", label: "Catálogo", icon: "🛒" },
  { to: "/portal/carrito", label: "Carrito", icon: "🧺" },
  { to: "/portal/pedidos", label: "Mis Pedidos", icon: "📦" },
  { to: "/portal/facturas", label: "Mis Facturas", icon: "🧾" },
  { to: "/perfil", label: "Mi Perfil", icon: "⚙️" },
];

export default function PortalClienteLayout() {
  return <SidebarLayout enlaces={ENLACES} />;
}
