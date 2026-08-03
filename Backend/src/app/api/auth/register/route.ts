import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enviarCorreoDefinirPassword } from "@/lib/email";

const TIPOS_PERMITIDOS = ["Cliente", "Entrenador", "Gimnasio"] as const;
const TOKEN_VIGENCIA_HORAS = 24;

function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { nombre, apellido, correo, usuario, tipo } = body as Record<string, unknown>;

  if (
    typeof nombre !== "string" || !nombre.trim() ||
    typeof apellido !== "string" || !apellido.trim() ||
    typeof correo !== "string" || !correo.trim() ||
    typeof usuario !== "string" || !usuario.trim() ||
    typeof tipo !== "string"
  ) {
    return NextResponse.json({ error: "Nombre, apellido, correo, usuario y tipo son obligatorios." }, { status: 400 });
  }

  if (!esCorreoValido(correo)) {
    return NextResponse.json({ error: "El correo electrónico no tiene un formato válido." }, { status: 400 });
  }

  if (!TIPOS_PERMITIDOS.includes(tipo as (typeof TIPOS_PERMITIDOS)[number])) {
    return NextResponse.json(
      { error: `El tipo debe ser uno de: ${TIPOS_PERMITIDOS.join(", ")}.` },
      { status: 400 },
    );
  }

  const correoNormalizado = correo.trim().toLowerCase();
  const usuarioNormalizado = usuario.trim();

  const correoExistente = await db("users").where({ correo: correoNormalizado }).first();
  if (correoExistente) {
    return NextResponse.json({ error: "El correo ya está registrado." }, { status: 409 });
  }

  const usuarioExistente = await db("users").where({ usuario: usuarioNormalizado }).first();
  if (usuarioExistente) {
    return NextResponse.json({ error: "El nombre de usuario ya está en uso." }, { status: 409 });
  }

  const rol = await db("roles").where({ nombre: tipo }).first();
  if (!rol) {
    return NextResponse.json({ error: "El tipo de usuario indicado no existe." }, { status: 400 });
  }

  const [userId] = await db("users").insert({
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    correo: correoNormalizado,
    usuario: usuarioNormalizado,
    password_hash: null,
    rol_id: rol.id,
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_VIGENCIA_HORAS * 60 * 60 * 1000);

  await db("password_set_tokens").insert({
    user_id: userId,
    token,
    expires_at: expiresAt,
  });

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const enlace = `${frontendUrl}/establecer-password?token=${token}`;

  await enviarCorreoDefinirPassword(correoNormalizado, enlace);

  return NextResponse.json(
    { message: "Usuario creado. Se envió un enlace al correo para definir la contraseña." },
    { status: 201 },
  );
}
