const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

async function post<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? "Ocurrió un error inesperado.");
  }

  return data as T;
}

export interface RegistroPayload {
  nombre: string;
  apellido: string;
  correo: string;
  usuario: string;
  tipo: "Cliente" | "Entrenador" | "Gimnasio";
}

export function registrarUsuario(payload: RegistroPayload) {
  return post<{ message: string }>("/api/auth/register", payload);
}

export function establecerPassword(token: string, password: string) {
  return post<{ message: string }>("/api/auth/set-password", { token, password });
}
