import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const usuario = searchParams.get("usuario")?.trim();

  if (!usuario) {
    return NextResponse.json({ error: "Debes indicar un usuario a buscar." }, { status: 400 });
  }

  const entrenador = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("users.usuario", usuario)
    .andWhere("roles.nombre", "Entrenador")
    .select("users.id", "users.nombre", "users.apellido", "users.usuario", "users.especialidad")
    .first();

  if (!entrenador) {
    return NextResponse.json({ error: "No existe un entrenador con ese usuario." }, { status: 404 });
  }

  return NextResponse.json({ entrenador });
}
