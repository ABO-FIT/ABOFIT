import SidebarLayout, { type EnlaceNav } from "./SidebarLayout";

const ENLACES: EnlaceNav[] = [
  { to: "/portal/hoy", label: "Hoy", icon: "★" },
  { to: "/portal/mi-plan", label: "Mi plan", icon: "▤" },
  { to: "/portal/mis-rutinas", label: "Mis entrenamientos", icon: "✓" },
  { to: "/portal/mi-progreso", label: "Mi progreso", icon: "▲" },
  { to: "/portal/mi-nutricion", label: "Mi nutrición", icon: "◆" },
  { to: "/portal/catalogo", label: "Suplementos", icon: "▦" },
  { to: "/portal/carrito", label: "Carrito", icon: "▣" },
  { to: "/portal/pedidos", label: "Mis pedidos", icon: "▣" },
  { to: "/portal/facturas", label: "Mis facturas", icon: "▤" },
  { to: "/portal/pagos", label: "Mis pagos", icon: "▲" },
  { to: "/portal/contacto", label: "Contacto", icon: "✉" },
  { to: "/portal/perfil", label: "Perfil", icon: "☺" },
];

export default function PortalClienteLayout() {
  return <SidebarLayout enlaces={ENLACES} />;
}
