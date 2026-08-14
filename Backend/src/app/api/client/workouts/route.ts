import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { parsearJson } from "@/lib/json";
import { claveSemanaActual } from "@/lib/semana";

interface DiaRutina {
  id: string;
  day: string;
  focus: string;
  exercises: string[];
}

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const usuario = await db("users").where({ id: sesion.userId }).first();

  if (!usuario.plan_key || !usuario.goal_key) {
    return NextResponse.json({ asignado: false });
  }

  const rutinaCustom = await db("custom_routines").where({ user_id: sesion.userId }).first();
  const rutinaDefault = rutinaCustom ? null : await db("default_routines").where({ goal_key: usuario.goal_key }).first();
  const rutina = rutinaCustom ?? rutinaDefault;
  const dias = rutina ? parsearJson<DiaRutina[]>(rutina.contenido) : [];

  const semana = claveSemanaActual();
  const completados = await db("workout_completions")
    .where({ user_id: sesion.userId, semana_key: semana })
    .pluck("dia_id");

  const porcentaje = dias.length > 0 ? Math.round((completados.length / dias.length) * 100) : 0;

  return NextResponse.json({ asignado: true, dias, completados, porcentaje, semana });
}
