import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { enviarCorreoDefinirPassword } from "@/lib/email";

const USUARIO_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const PLANES_VALIDOS = ["A", "B"];
const OBJETIVOS_VALIDOS = ["masa", "grasa", "mantenimiento", "rendimiento"];
const TOKEN_VIGENCIA_HORAS = 24;

function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { nombre, apellido, correo, usuario, telefono, planKey, goalKey } = body as Record<string, unknown>;

  if (
    typeof nombre !== "string" || !nombre.trim() ||
    typeof apellido !== "string" || !apellido.trim() ||
    typeof correo !== "string" || !correo.trim() ||
    typeof usuario !== "string" || !usuario.trim() ||
    typeof telefono !== "string" || !telefono.trim()
  ) {
    return NextResponse.json(
      { error: "Nombre, apellido, correo, usuario y teléfono son obligatorios." },
      { status: 400 },
    );
  }

  if (!esCorreoValido(correo)) {
    return NextResponse.json({ error: "El correo electrónico no tiene un formato válido." }, { status: 400 });
  }

  if (!USUARIO_REGEX.test(usuario)) {
    return NextResponse.json(
      { error: "El usuario debe tener entre 3 y 20 caracteres (letras, números o guión bajo)." },
      { status: 400 },
    );
  }

  if (typeof planKey !== "string" || !PLANES_VALIDOS.includes(planKey)) {
    return NextResponse.json({ error: "El plan debe ser A o B." }, { status: 400 });
  }

  if (typeof goalKey !== "string" || !OBJETIVOS_VALIDOS.includes(goalKey)) {
    return NextResponse.json({ error: "El objetivo indicado no es válido." }, { status: 400 });
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

  const rol = await db("roles").where({ nombre: "Cliente" }).first();

  const [userId] = await db("users").insert({
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    correo: correoNormalizado,
    usuario: usuarioNormalizado,
    telefono: telefono.trim(),
    password_hash: null,
    rol_id: rol.id,
    trainer_id: sesion.userId,
    plan_key: planKey,
    goal_key: goalKey,
    fecha_inicio: new Date().toISOString().slice(0, 10),
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_VIGENCIA_HORAS * 60 * 60 * 1000);

  await db("password_set_tokens").insert({ user_id: userId, token, expires_at: expiresAt });

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  const enlace = `${frontendUrl}/establecer-password?token=${token}`;
  await enviarCorreoDefinirPassword(correoNormalizado, enlace);

  return NextResponse.json({ message: "Cliente creado. Se envió un enlace al correo para definir la contraseña." }, { status: 201 });
}
