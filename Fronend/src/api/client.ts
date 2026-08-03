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
