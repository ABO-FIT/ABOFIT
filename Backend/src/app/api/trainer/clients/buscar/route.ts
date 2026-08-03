import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const usuario = searchParams.get("usuario")?.trim();

  if (!usuario) {
    return NextResponse.json({ error: "Debes indicar un usuario a buscar." }, { status: 400 });
  }

  const cliente = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("users.usuario", usuario)
    .andWhere("roles.nombre", "Cliente")
    .select("users.id", "users.nombre", "users.apellido", "users.usuario", "users.correo", "users.trainer_id")
    .first();

  if (!cliente) {
    return NextResponse.json({ error: "No existe un cliente con ese usuario." }, { status: 404 });
  }

  if (cliente.trainer_id && cliente.trainer_id !== sesion.userId) {
    return NextResponse.json({ error: "Ese cliente ya tiene un entrenador asignado." }, { status: 409 });
  }

  return NextResponse.json({
    cliente: {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      usuario: cliente.usuario,
      correo: cliente.correo,
      yaEsMio: cliente.trainer_id === sesion.userId,
    },
  });
}
