import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { firmarToken } from "@/lib/auth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { identificador, password } = body as Record<string, unknown>;

  if (typeof identificador !== "string" || !identificador.trim() || typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Usuario/correo y contraseña son obligatorios." }, { status: 400 });
  }

  const valor = identificador.trim();

  const usuario = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("users.correo", valor.toLowerCase())
    .orWhere("users.usuario", valor)
    .select("users.*", "roles.nombre as rol_nombre")
    .first();

  if (!usuario || !usuario.password_hash) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  const passwordValida = await bcrypt.compare(password, usuario.password_hash);
  if (!passwordValida) {
    return NextResponse.json({ error: "Credenciales inválidas." }, { status: 401 });
  }

  const token = firmarToken({ userId: usuario.id, rol: usuario.rol_nombre });

  return NextResponse.json({
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      usuario: usuario.usuario,
      rol: usuario.rol_nombre,
    },
  });
}
