import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

const TIPOS_VALIDOS = ["desayuno", "almuerzo", "cena", "snack"];

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const registros = await db("nutrition_logs")
    .where({ user_id: sesion.userId })
    .orderBy("fecha", "desc")
    .orderBy("id", "desc")
    .select("id", "fecha", "tipo", "descripcion");

  return NextResponse.json({ registros });
}

export async function POST(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.tipo !== "string" || typeof body.descripcion !== "string") {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const tipo = body.tipo.trim();
  const descripcion = body.descripcion.trim();

  if (!TIPOS_VALIDOS.includes(tipo)) {
    return NextResponse.json({ error: "Tipo de comida inválido." }, { status: 400 });
  }
  if (!descripcion) {
    return NextResponse.json({ error: "La descripción es obligatoria." }, { status: 400 });
  }

  const [id] = await db("nutrition_logs").insert({
    user_id: sesion.userId,
    fecha: new Date().toISOString().slice(0, 10),
    tipo,
    descripcion,
  });

  return NextResponse.json({ id, message: "Registro guardado." }, { status: 201 });
}
