import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { crearNotificacion } from "@/lib/notificaciones";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const mensajes = await db("messages")
    .where({ client_id: sesion.userId })
    .orderBy("created_at", "asc")
    .select("id", "remitente", "texto", "created_at");

  return NextResponse.json({ mensajes });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const texto = body && typeof body.texto === "string" ? body.texto.trim() : "";

  if (!texto) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío." }, { status: 400 });
  }

  const [id] = await db("messages").insert({
    client_id: sesion.userId,
    remitente: "cliente",
    texto,
  });

  const cliente = await db("users").where({ id: sesion.userId }).first();
  if (cliente?.trainer_id) {
    await crearNotificacion({
      userId: cliente.trainer_id,
      tipo: "mensaje",
      titulo: `Mensaje de ${cliente.nombre} ${cliente.apellido}`,
      subtitulo: texto.slice(0, 80),
      link: "/entrenador/mensajes",
    });
  }

  return NextResponse.json({ id }, { status: 201 });
}
