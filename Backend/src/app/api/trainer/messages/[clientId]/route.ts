import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";

export async function GET(request: Request, { params }: { params: { clientId: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientId = Number(params.clientId);
  const cliente = await obtenerClienteDelEntrenador(sesion.userId, clientId);
  if (!cliente) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  const mensajes = await db("messages")
    .where({ client_id: clientId })
    .orderBy("created_at", "asc")
    .select("id", "remitente", "texto", "created_at");

  await db("messages").where({ client_id: clientId, remitente: "cliente", leido: false }).update({ leido: true });

  return NextResponse.json({ mensajes });
}

export async function POST(request: Request, { params }: { params: { clientId: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientId = Number(params.clientId);
  const cliente = await obtenerClienteDelEntrenador(sesion.userId, clientId);
  if (!cliente) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const texto = body && typeof body.texto === "string" ? body.texto.trim() : "";

  if (!texto) {
    return NextResponse.json({ error: "El mensaje no puede estar vacío." }, { status: 400 });
  }

  const [id] = await db("messages").insert({ client_id: clientId, remitente: "entrenador", texto, leido: true });

  return NextResponse.json({ id }, { status: 201 });
}
