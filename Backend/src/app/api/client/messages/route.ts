import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

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

  return NextResponse.json({ id }, { status: 201 });
}
