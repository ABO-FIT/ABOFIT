import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientes = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("roles.nombre", "Cliente")
    .whereNull("users.trainer_id")
    .select("users.id", "users.nombre", "users.apellido", "users.usuario", "users.correo", "users.created_at")
    .orderBy("users.created_at", "desc");

  return NextResponse.json({ clientes });
}
