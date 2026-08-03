const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, method: string, body?: unknown, token?: string | null): Promise<T> {
  const esFormData = body instanceof FormData;
  const headers: Record<string, string> = {};
  if (!esFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: esFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Ocurrió un error inesperado.");
  }

  return data as T;
}

export type TipoRegistro = "Entrenador" | "Cliente";

export interface RegistroPayload {
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  telefono: string;
  tipo: TipoRegistro;
  especialidad?: string;
  bio?: string;
}

export function registrarUsuario(payload: RegistroPayload) {
  return request<{ message: string }>("/api/auth/register", "POST", payload);
}

export function establecerPassword(token: string, password: string) {
  return request<{ message: string }>("/api/auth/set-password", "POST", { token, password });
}

export function solicitarRecuperarPassword(identificador: string) {
  return request<{ message: string }>("/api/auth/forgot-password", "POST", { identificador });
}

export interface UsuarioSesion {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  rol: string;
}

export function iniciarSesion(identificador: string, password: string) {
  return request<{ token: string; usuario: UsuarioSesion }>("/api/auth/login", "POST", { identificador, password });
}

export interface Perfil {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  telefono: string;
  especialidad: string | null;
  bio: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  pay_phone: string | null;
  gym_id: number | null;
  rol: string;
}

export function obtenerPerfil(token: string) {
  return request<{ usuario: Perfil }>("/api/profile", "GET", undefined, token);
}

export interface ActualizarPerfilPayload {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  especialidad?: string;
  bio?: string;
  bankName?: string;
  bankAccount?: string;
  bankHolder?: string;
  payPhone?: string;
  gymId?: number;
}

export function actualizarPerfil(token: string, payload: ActualizarPerfilPayload) {
  return request<{ message: string }>("/api/profile", "PUT", payload, token);
}

export function cambiarPassword(token: string, passwordActual: string, passwordNueva: string) {
  return request<{ message: string }>("/api/profile/password", "PUT", { passwordActual, passwordNueva }, token);
}

export interface Goal {
  key: string;
  label: string;
  shortLabel: string;
  color: string;
}

export interface Plan {
  key: string;
  name: string;
  price: number;
  includesDiet: boolean;
  description: string;
}

export interface DiaRutina {
  id: string;
  day: string;
  focus: string;
  exercises: string[];
}

export interface Comida {
  meal: string;
  items: string;
}

export interface Dieta {
  nota: string;
  comidas: Comida[];
}

export type MiPlanRespuesta =
  | { asignado: false }
  | { asignado: true; plan: Plan | null; goal: Goal | null; rutina: DiaRutina[]; dieta: Dieta | null };

export function obtenerMiPlan(token: string) {
  return request<MiPlanRespuesta>("/api/client/plan", "GET", undefined, token);
}

export type MisRutinasRespuesta =
  | { asignado: false }
  | { asignado: true; dias: DiaRutina[]; completados: string[]; porcentaje: number; semana: string };

export function obtenerMisRutinas(token: string) {
  return request<MisRutinasRespuesta>("/api/client/workouts", "GET", undefined, token);
}

export function marcarDiaRutina(token: string, diaId: string) {
  return request<{ completado: boolean }>("/api/client/workouts/toggle", "POST", { diaId }, token);
}

export interface ProgressEntry {
  id: number;
  fecha: string;
  peso: string | null;
  cintura: string | null;
  nota: string | null;
  foto_path: string | null;
}

export function obtenerProgreso(token: string) {
  return request<{ entradas: ProgressEntry[] }>("/api/client/progress", "GET", undefined, token);
}

export function registrarProgreso(token: string, datos: FormData) {
  return request<{ id: number; message: string }>("/api/client/progress", "POST", datos, token);
}

export interface Mensaje {
  id: number;
  remitente: "cliente" | "entrenador";
  texto: string;
  created_at: string;
}

export function obtenerMensajes(token: string) {
  return request<{ mensajes: Mensaje[] }>("/api/client/messages", "GET", undefined, token);
}

export function enviarMensaje(token: string, texto: string) {
  return request<{ id: number }>("/api/client/messages", "POST", { texto }, token);
}

export interface Entrenador {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  especialidad: string | null;
}

export function obtenerMiEntrenador(token: string) {
  return request<{ entrenador: Entrenador | null }>("/api/client/entrenador", "GET", undefined, token);
}

export function buscarEntrenador(token: string, usuario: string) {
  return request<{ entrenador: Entrenador }>(`/api/client/entrenador/buscar?usuario=${encodeURIComponent(usuario)}`, "GET", undefined, token);
}

export function vincularEntrenador(token: string, usuario: string) {
  return request<{ message: string }>("/api/client/entrenador", "POST", { usuario }, token);
}

export interface ClienteResumen {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  correo: string;
  plan_key: string | null;
  goal_key: string | null;
}

export function obtenerMisClientes(token: string) {
  return request<{ clientes: ClienteResumen[] }>("/api/trainer/clients", "GET", undefined, token);
}

export interface ClienteBuscado {
  id: number;
  nombre: string;
  apellido: string;
  usuario: string;
  correo: string;
  yaEsMio: boolean;
}

export function buscarCliente(token: string, usuario: string) {
  return request<{ cliente: ClienteBuscado }>(`/api/trainer/clients/buscar?usuario=${encodeURIComponent(usuario)}`, "GET", undefined, token);
}

export function asignarCliente(token: string, usuario: string, planKey: string, goalKey: string) {
  return request<{ message: string }>("/api/trainer/clients", "POST", { usuario, planKey, goalKey }, token);
}

export interface NuevoClientePayload {
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  telefono: string;
  planKey: string;
  goalKey: string;
}

export function crearClienteDirecto(token: string, payload: NuevoClientePayload) {
  return request<{ message: string }>("/api/trainer/clients/nuevo", "POST", payload, token);
}

export interface ClienteDetalle {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  telefono: string;
  planKey: string | null;
  goalKey: string | null;
  fechaInicio: string | null;
  peso: string | null;
  pesoUnidad: "kg" | "lb";
  altura: string | null;
  alturaUnidad: "cm" | "ft";
  edad: number | null;
  sexo: "male" | "female" | null;
  nivelActividad: string | null;
  cintura: string | null;
  cadera: string | null;
  presionSistolica: number | null;
  presionDiastolica: number | null;
}

export interface SaludCalculada {
  imc: number | null;
  imcClasificacion: string | null;
  icc: number | null;
  iccClasificacion: string | null;
  presionClasificacion: string | null;
  caloriasObjetivo: number | null;
  proteinaObjetivoG: number | null;
}

export interface DetalleClienteRespuesta {
  cliente: ClienteDetalle;
  salud: SaludCalculada;
  porcentajeSemana: number;
  progreso: ProgressEntry[];
}

export function obtenerDetalleCliente(token: string, clientId: number) {
  return request<DetalleClienteRespuesta>(`/api/trainer/clients/${clientId}`, "GET", undefined, token);
}

export interface EvaluacionPayload {
  peso?: number;
  pesoUnidad?: "kg" | "lb";
  altura?: number;
  alturaUnidad?: "cm" | "ft";
  edad?: number;
  sexo?: "male" | "female";
  nivelActividad?: string;
  cintura?: number;
  cadera?: number;
  presionSistolica?: number;
  presionDiastolica?: number;
}

export function guardarEvaluacion(token: string, clientId: number, payload: EvaluacionPayload) {
  return request<{ message: string }>(`/api/trainer/clients/${clientId}/evaluacion`, "PUT", payload, token);
}

export function cambiarObjetivoCliente(token: string, clientId: number, goalKey: string) {
  return request<{ message: string }>(`/api/trainer/clients/${clientId}/objetivo`, "PUT", { goalKey }, token);
}

export function cambiarPlanCliente(token: string, clientId: number, planKey: string) {
  return request<{ message: string }>(`/api/trainer/clients/${clientId}/plan`, "PUT", { planKey }, token);
}

export function obtenerRutinaCliente(token: string, clientId: number) {
  return request<{ personalizada: boolean; dias: DiaRutina[] }>(`/api/trainer/clients/${clientId}/rutina`, "GET", undefined, token);
}

export function guardarRutinaCliente(token: string, clientId: number, dias: DiaRutina[]) {
  return request<{ message: string }>(`/api/trainer/clients/${clientId}/rutina`, "PUT", { dias }, token);
}

export function obtenerDietaCliente(token: string, clientId: number) {
  return request<{ personalizada: boolean; nota: string; comidas: Comida[] }>(`/api/trainer/clients/${clientId}/dieta`, "GET", undefined, token);
}

export function guardarDietaCliente(token: string, clientId: number, nota: string, comidas: Comida[]) {
  return request<{ message: string }>(`/api/trainer/clients/${clientId}/dieta`, "PUT", { nota, comidas }, token);
}

export interface ClienteMensajes {
  id: number;
  nombre: string;
  apellido: string;
  noLeidos: number;
  ultimoMensaje: string | null;
}

export function obtenerClientesConMensajes(token: string) {
  return request<{ clientes: ClienteMensajes[] }>("/api/trainer/messages", "GET", undefined, token);
}

export function obtenerHiloCliente(token: string, clientId: number) {
  return request<{ mensajes: Mensaje[] }>(`/api/trainer/messages/${clientId}`, "GET", undefined, token);
}

export function enviarMensajeACliente(token: string, clientId: number, texto: string) {
  return request<{ id: number }>(`/api/trainer/messages/${clientId}`, "POST", { texto }, token);
}

export interface PanelEntrenador {
  totalClientes: number;
  clientesPlanB: number;
  mensajesSinLeer: number;
  cumplimientoPromedio: number;
}

export function obtenerPanelEntrenador(token: string) {
  return request<PanelEntrenador>("/api/trainer/panel", "GET", undefined, token);
}

export interface Producto {
  id: number;
  cat: string;
  name: string;
  price: number;
  goals: string[];
  recomendado: boolean;
}

export function obtenerCatalogo(token: string | null, filtros: { goal?: string; cat?: string; buscar?: string } = {}) {
  const params = new URLSearchParams();
  if (filtros.goal) params.set("goal", filtros.goal);
  if (filtros.cat) params.set("cat", filtros.cat);
  if (filtros.buscar) params.set("buscar", filtros.buscar);
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<{ productos: Producto[]; categorias: string[] }>(`/api/catalog${query}`, "GET", undefined, token);
}

export function obtenerProducto(id: number) {
  return request<{ producto: Producto }>(`/api/catalog/${id}`, "GET");
}

export interface CartItem {
  id: number;
  name: string;
  cat: string;
  price: number;
  qty: number;
}

export function obtenerCarrito(token: string) {
  return request<{ items: CartItem[]; total: number }>("/api/cart", "GET", undefined, token);
}

export function agregarAlCarrito(token: string, productId: number, qty = 1) {
  return request<{ message: string }>("/api/cart", "POST", { productId, qty }, token);
}

export function actualizarCantidadCarrito(token: string, productId: number, qty: number) {
  return request<{ message: string }>(`/api/cart/${productId}`, "PUT", { qty }, token);
}

export function quitarDelCarrito(token: string, productId: number) {
  return request<{ message: string }>(`/api/cart/${productId}`, "DELETE", undefined, token);
}

export interface Pedido {
  id: number;
  total: number;
  estado: "pendiente" | "recibido" | "entregado" | "cancelado";
  fecha: string;
  items: { name: string; price: number; qty: number }[];
}

export function obtenerPedidos(token: string) {
  return request<{ pedidos: Pedido[] }>("/api/orders", "GET", undefined, token);
}

export function crearPedido(token: string) {
  return request<{ id: number; message: string }>("/api/orders", "POST", undefined, token);
}

export interface Factura {
  id: number;
  numero: string;
  order_id: number;
  monto: number;
  estado: "pendiente" | "pagada";
  fecha: string;
}

export function obtenerFacturas(token: string) {
  return request<{ facturas: Factura[] }>("/api/invoices", "GET", undefined, token);
}

// ---- Administración ----

export interface UsuarioAdmin {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  activo: boolean;
  rol: string;
}

export function obtenerUsuarios(token: string, filtros: { rol?: string; buscar?: string } = {}) {
  const params = new URLSearchParams();
  if (filtros.rol) params.set("rol", filtros.rol);
  if (filtros.buscar) params.set("buscar", filtros.buscar);
  const query = params.toString() ? `?${params.toString()}` : "";
  return request<{ usuarios: UsuarioAdmin[] }>(`/api/admin/users${query}`, "GET", undefined, token);
}

export interface NuevoUsuarioAdminPayload {
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  telefono: string;
  rol: string;
}

export function crearUsuarioAdmin(token: string, payload: NuevoUsuarioAdminPayload) {
  return request<{ message: string }>("/api/admin/users", "POST", payload, token);
}

export function editarUsuarioAdmin(token: string, id: number, payload: { nombre: string; apellido: string; correo: string; telefono: string }) {
  return request<{ message: string }>(`/api/admin/users/${id}`, "PUT", payload, token);
}

export function cambiarEstadoUsuario(token: string, id: number, activo: boolean) {
  return request<{ message: string }>(`/api/admin/users/${id}/estado`, "PUT", { activo }, token);
}

export function cambiarRolUsuario(token: string, id: number, rol: string) {
  return request<{ message: string }>(`/api/admin/users/${id}/rol`, "PUT", { rol }, token);
}

export interface Gimnasio {
  id: number;
  name: string;
  city: string;
  address: string | null;
  phone: string | null;
}

export function obtenerGimnasios(token: string) {
  return request<{ gimnasios: Gimnasio[] }>("/api/gyms", "GET", undefined, token);
}

export function obtenerGimnasiosAdmin(token: string) {
  return request<{ gimnasios: Gimnasio[] }>("/api/admin/gyms", "GET", undefined, token);
}

export function crearGimnasio(token: string, payload: Omit<Gimnasio, "id">) {
  return request<{ id: number; message: string }>("/api/admin/gyms", "POST", payload, token);
}

export function editarGimnasio(token: string, id: number, payload: Omit<Gimnasio, "id">) {
  return request<{ message: string }>(`/api/admin/gyms/${id}`, "PUT", payload, token);
}

export function eliminarGimnasio(token: string, id: number) {
  return request<{ message: string }>(`/api/admin/gyms/${id}`, "DELETE", undefined, token);
}

export interface ProductoAdmin {
  id: number;
  cat: string;
  name: string;
  price: number;
  goals: string[];
  stock: number;
}

export function obtenerProductosAdmin(token: string) {
  return request<{ productos: ProductoAdmin[] }>("/api/admin/products", "GET", undefined, token);
}

export function crearProducto(token: string, payload: Omit<ProductoAdmin, "id">) {
  return request<{ id: number; message: string }>("/api/admin/products", "POST", payload, token);
}

export function editarProducto(token: string, id: number, payload: Omit<ProductoAdmin, "id">) {
  return request<{ message: string }>(`/api/admin/products/${id}`, "PUT", payload, token);
}

export function eliminarProducto(token: string, id: number) {
  return request<{ message: string }>(`/api/admin/products/${id}`, "DELETE", undefined, token);
}

export interface PlanAdmin {
  key: string;
  name: string;
  price: number;
  includes_diet: boolean;
  description: string;
}

export function obtenerPlanesAdmin(token: string) {
  return request<{ planes: PlanAdmin[] }>("/api/admin/plans", "GET", undefined, token);
}

export function editarPlan(token: string, key: string, payload: { name: string; price: number; includesDiet: boolean; description: string }) {
  return request<{ message: string }>(`/api/admin/plans/${key}`, "PUT", payload, token);
}

export interface PedidoAdmin {
  id: number;
  total: number;
  estado: Pedido["estado"];
  fecha: string;
  cliente: { nombre: string; apellido: string; correo: string; telefono: string };
  items: { name: string; price: number; qty: number }[];
}

export function obtenerPedidosAdmin(token: string, estado?: string) {
  const query = estado ? `?estado=${estado}` : "";
  return request<{ pedidos: PedidoAdmin[] }>(`/api/admin/orders${query}`, "GET", undefined, token);
}

export function cambiarEstadoPedido(token: string, id: number, estado: PedidoAdmin["estado"]) {
  return request<{ message: string }>(`/api/admin/orders/${id}/estado`, "PUT", { estado }, token);
}

export interface FacturaAdmin {
  id: number;
  numero: string;
  orderId: number;
  monto: number;
  estado: "pendiente" | "pagada";
  fecha: string;
  cliente: { nombre: string; apellido: string; correo: string };
}

export function obtenerFacturasAdmin(token: string, estado?: string) {
  const query = estado ? `?estado=${estado}` : "";
  return request<{ facturas: FacturaAdmin[] }>(`/api/admin/invoices${query}`, "GET", undefined, token);
}

export function cambiarEstadoFactura(token: string, id: number, estado: "pendiente" | "pagada") {
  return request<{ message: string }>(`/api/admin/invoices/${id}/estado`, "PUT", { estado }, token);
}

export interface ReporteVentas {
  totalHistorico: number;
  totalUltimos30Dias: number;
  pedidosPorEstado: { estado: string; total: number }[];
  topProductos: { name: string; cantidad: number }[];
}

export function obtenerReporteVentas(token: string) {
  return request<ReporteVentas>("/api/admin/reportes/ventas", "GET", undefined, token);
}

export interface PanelAdmin {
  usuariosPorRol: { rol: string; total: number }[];
  totalGimnasios: number;
  totalProductos: number;
  pedidosPendientes: number;
  facturasPendientes: number;
}

export function obtenerPanelAdmin(token: string) {
  return request<PanelAdmin>("/api/admin/panel", "GET", undefined, token);
}

export interface RegistroAuditoria {
  id: number;
  admin_nombre: string;
  target_type: string;
  target_id: number;
  target_nombre: string | null;
  accion: string;
  antes: unknown;
  despues: unknown;
  created_at: string;
}

export function obtenerAuditoria(token: string) {
  return request<{ registros: RegistroAuditoria[] }>("/api/admin/auditoria", "GET", undefined, token);
}
