import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "cambia-este-valor-por-uno-seguro";
const TOKEN_VIGENCIA = "8h";

export interface SesionPayload {
  userId: number;
  rol: string;
}

export function firmarToken(payload: SesionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_VIGENCIA });
}

export function obtenerSesion(request: Request): SesionPayload | null {
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
