import jwt from "jsonwebtoken";
import { db } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET ?? "cambia-este-valor-por-uno-seguro";
const TOKEN_VIGENCIA = "8h";

export interface SesionPayload {
  userId: number;
  rol: string;
}

export function firmarToken(payload: SesionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_VIGENCIA });
}

function decodificarToken(request: Request): SesionPayload | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    return jwt.verify(token, JWT_SECRET) as SesionPayload;
  } catch {
    return null;
  }
}

/**
 * Decodifica el JWT y además verifica que la cuenta siga activa en ese
 * momento. A diferencia de solo validar la firma del token, esto hace que
 * desactivar a un usuario le corte el acceso de inmediato en la siguiente
 * petición — no solo le bloquea un futuro login mientras su token de hasta
 * 8h siga vigente.
 */
export async function obtenerSesion(request: Request): Promise<SesionPayload | null> {
  const payload = decodificarToken(request);
  if (!payload) return null;

  const usuario = await db("users").where({ id: payload.userId }).select("activo").first();
  if (!usuario?.activo) return null;

  return payload;
}
