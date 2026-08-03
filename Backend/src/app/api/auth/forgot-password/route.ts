import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enviarCorreoDefinirPassword } from "@/lib/email";

const TOKEN_VIGENCIA_HORAS = 2;
const MENSAJE_GENERICO = "Si el correo o usuario existe, se envió un enlace para restablecer la contraseña.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { identificador } = body as Record<string, unknown>;

  if (typeof identificador !== "string" || !identificador.trim()) {
    return NextResponse.json({ error: "Usuario o correo es obligatorio." }, { status: 400 });
  }

  const valor = identificador.trim();

  const usuario = await db("users")
    .where("correo", valor.toLowerCase())
    .orWhere("usuario", valor)
    .first();

  if (usuario) {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + TOKEN_VIGENCIA_HORAS * 60 * 60 * 1000);

    await db("password_set_tokens").insert({
      user_id: usuario.id,
      token,
      expires_at: expiresAt,
    });

    const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
    const enlace = `${frontendUrl}/establecer-password?token=${token}`;

    await enviarCorreoDefinirPassword(usuario.correo, enlace);
  }

  return NextResponse.json({ message: MENSAJE_GENERICO });
}
