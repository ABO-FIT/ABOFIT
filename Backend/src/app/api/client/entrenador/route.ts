import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const usuario = await db("users").where({ id: sesion.userId }).first();

  if (!usuario.trainer_id) {
    return NextResponse.json({ entrenador: null });
  }

  const entrenador = await db("users")
    .where({ id: usuario.trainer_id })
    .select("id", "nombre", "apellido", "usuario", "especialidad")
    .first();

  return NextResponse.json({ entrenador: entrenador ?? null });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const usuario = body && typeof body.usuario === "string" ? body.usuario.trim() : "";

  if (!usuario) {
    return NextResponse.json({ error: "El usuario del entrenador es obligatorio." }, { status: 400 });
  }

  const entrenador = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("users.usuario", usuario)
    .andWhere("roles.nombre", "Entrenador")
    .select("users.id")
    .first();

  if (!entrenador) {
    return NextResponse.json({ error: "No existe un entrenador con ese usuario." }, { status: 404 });
  }

  await db("users").where({ id: sesion.userId }).update({ trainer_id: entrenador.id });

  return NextResponse.json({ message: "Entrenador vinculado correctamente." });
}
