import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { claveSemanaActual } from "@/lib/semana";
import { parsearJson } from "@/lib/json";
import { registrarHistorial } from "@/lib/historial";

interface DiaRutina {
  id: string;
  day: string;
  focus: string;
}

export async function POST(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const diaId = body && typeof body.diaId === "string" ? body.diaId : null;

  if (!diaId) {
    return NextResponse.json({ error: "diaId es obligatorio." }, { status: 400 });
  }

  const usuarioActivo = await db("users").where({ id: sesion.userId }).first();
  if (!usuarioActivo?.plan_key || !usuarioActivo.goal_key) {
    return NextResponse.json({ error: "No tienes un plan activo." }, { status: 400 });
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

  const rutinaCustom = await db("custom_routines").where({ user_id: sesion.userId }).first();
  const rutinaDefault = rutinaCustom ? null : await db("default_routines").where({ goal_key: usuarioActivo.goal_key }).first();
  const rutina = rutinaCustom ?? rutinaDefault;
  const dias = rutina ? parsearJson<DiaRutina[]>(rutina.contenido) : [];
  const dia = dias.find((d) => d.id === diaId);
  if (dia) {
    await registrarHistorial({ userId: sesion.userId, tipo: "rutina", referencia: diaId, etiqueta: `${dia.day} — ${dia.focus}` });
  }

  return NextResponse.json({ completado: true });
}
