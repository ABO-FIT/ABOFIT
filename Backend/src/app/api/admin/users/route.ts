import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { enviarCorreoDefinirPassword } from "@/lib/email";
import { registrarAuditoria } from "@/lib/auditoria";

const ROLES_VALIDOS = ["Administrador", "Entrenador", "Cliente"];
const USUARIO_REGEX = /^[a-zA-Z0-9_]{3,20}$/;
const TOKEN_VIGENCIA_HORAS = 24;

function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const rol = searchParams.get("rol");
  const buscar = searchParams.get("buscar")?.trim().toLowerCase();

  let query = db("users")
    .join("roles", "roles.id", "users.rol_id")
    .select(
      "users.id", "users.nombre", "users.apellido", "users.correo", "users.usuario",
      "users.activo", "roles.nombre as rol",
    );

  if (rol) {
    query = query.andWhere("roles.nombre", rol);
  }

  if (buscar) {
    query = query.andWhere((qb) => {
      qb.whereRaw("LOWER(users.nombre) LIKE ?", [`%${buscar}%`])
        .orWhereRaw("LOWER(users.apellido) LIKE ?", [`%${buscar}%`])
        .orWhereRaw("LOWER(users.usuario) LIKE ?", [`%${buscar}%`])
        .orWhereRaw("LOWER(users.correo) LIKE ?", [`%${buscar}%`]);
    });
  }

  const usuarios = await query.orderBy("users.nombre", "asc");

  return NextResponse.json({ usuarios });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { nombre, apellido, correo, usuario, telefono, rol } = body as Record<string, unknown>;

  if (
    typeof nombre !== "string" || !nombre.trim() ||
    typeof apellido !== "string" || !apellido.trim() ||
    typeof correo !== "string" || !correo.trim() ||
    typeof usuario !== "string" || !usuario.trim() ||
    typeof telefono !== "string" || !telefono.trim() ||
    typeof rol !== "string"
  ) {
    return NextResponse.json({ error: "Todos los campos son obligatorios." }, { status: 400 });
  }

  if (!esCorreoValido(correo)) {
    return NextResponse.json({ error: "El correo electrónico no tiene un formato válido." }, { status: 400 });
  }

  if (!USUARIO_REGEX.test(usuario)) {
    return NextResponse.json({ error: "El usuario debe tener entre 3 y 20 caracteres." }, { status: 400 });
  }

  if (!ROLES_VALIDOS.includes(rol)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
  }

  const correoNormalizado = correo.trim().toLowerCase();
  const usuarioNormalizado = usuario.trim();

  if (await db("users").where({ correo: correoNormalizado }).first()) {
    return NextResponse.json({ error: "El correo ya está registrado." }, { status: 409 });
  }

  if (await db("users").where({ usuario: usuarioNormalizado }).first()) {
    return NextResponse.json({ error: "El nombre de usuario ya está en uso." }, { status: 409 });
  }

  const rolRow = await db("roles").where({ nombre: rol }).first();

  const [userId] = await db("users").insert({
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    correo: correoNormalizado,
    usuario: usuarioNormalizado,
    telefono: telefono.trim(),
    password_hash: null,
    rol_id: rolRow.id,
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_VIGENCIA_HORAS * 60 * 60 * 1000);
  await db("password_set_tokens").insert({ user_id: userId, token, expires_at: expiresAt });

  const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:5173";
  await enviarCorreoDefinirPassword(correoNormalizado, `${frontendUrl}/establecer-password?token=${token}`);

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "usuario",
    targetId: userId,
    targetNombre: `${nombre.trim()} ${apellido.trim()}`,
    accion: "crear",
    despues: { nombre, apellido, correo: correoNormalizado, usuario: usuarioNormalizado, rol },
  });

  return NextResponse.json({ message: "Usuario creado correctamente." }, { status: 201 });
}
