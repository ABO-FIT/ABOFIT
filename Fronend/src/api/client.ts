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
