const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function request<T>(path: string, method: string, body?: unknown, token?: string | null): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
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
