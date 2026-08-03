import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { claveSemanaActual } from "@/lib/semana";

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const diaId = body && typeof body.diaId === "string" ? body.diaId : null;

  if (!diaId) {
    return NextResponse.json({ error: "diaId es obligatorio." }, { status: 400 });
  }

  const semana = claveSemanaActual();

  const existente = await db("workout_completions")
    .where({ user_id: sesion.userId, semana_key: semana, dia_id: diaId })
    .first();

  if (existente) {
    await db("workout_completions").where({ id: existente.id }).delete();
    return NextResponse.json({ completado: false });
  }

  await db("workout_completions").insert({ user_id: sesion.userId, semana_key: semana, dia_id: diaId });
  return NextResponse.json({ completado: true });
}
