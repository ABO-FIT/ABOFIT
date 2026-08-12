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

const DIAS_SEMANA = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

function encontrarDiaHoy(dias: DiaRutina[]): DiaRutina | null {
  const hoy = DIAS_SEMANA[new Date().getDay()];
  return dias.find((dia) => normalizar(dia.day).includes(hoy)) ?? null;
}

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const usuario = await db("users").where({ id: sesion.userId }).first();

  if (!usuario.plan_key || !usuario.goal_key) {
    return NextResponse.json({ asignado: false });
  }

  const [rutinaCustom, rutinaDefault, dietaCustom, dietaDefault, plan] = await Promise.all([
    db("custom_routines").where({ user_id: sesion.userId }).first(),
    db("default_routines").where({ goal_key: usuario.goal_key }).first(),
    db("custom_diets").where({ user_id: sesion.userId }).first(),
    db("default_diets").where({ goal_key: usuario.goal_key }).first(),
    usuario.plan_key ? db("plans").where({ key: usuario.plan_key }).first() : null,
  ]);

  const rutina = rutinaCustom ?? rutinaDefault;
  const dias = rutina ? parsearJson<DiaRutina[]>(rutina.contenido) : [];
  const diaHoy = encontrarDiaHoy(dias);

  let completadoHoy = false;
  if (diaHoy) {
    const semana = claveSemanaActual();
    const existe = await db("workout_completions")
      .where({ user_id: sesion.userId, semana_key: semana, dia_id: diaHoy.id })
      .first();
    completadoHoy = !!existe;
  }

  const dieta = dietaCustom ?? dietaDefault;
  const comidas = plan?.includes_diet && dieta ? parsearJson(dieta.comidas) : [];

  const fecha = new Date().toISOString().slice(0, 10);
  const comidasCompletadasHoy = await db("diet_completions")
    .where({ user_id: sesion.userId, fecha })
    .pluck("meal");

  return NextResponse.json({
    asignado: true,
    diaHoy,
    completadoHoy,
    comidas,
    comidasCompletadasHoy,
  });
}
