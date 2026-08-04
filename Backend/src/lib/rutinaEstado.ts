import { db } from "@/lib/db";
import { parsearJson } from "@/lib/json";
import { claveSemanaActual } from "@/lib/semana";

interface DiaRutina {
  id: string;
}

export async function obtenerPorcentajeSemana(userId: number, goalKey: string | null): Promise<number> {
  if (!goalKey) {
    return 0;
  }

  const rutinaCustom = await db("custom_routines").where({ user_id: userId }).first();
  const rutinaDefault = rutinaCustom ? null : await db("default_routines").where({ goal_key: goalKey }).first();
  const rutina = rutinaCustom ?? rutinaDefault;
  const dias = rutina ? parsearJson<DiaRutina[]>(rutina.contenido) : [];

  if (dias.length === 0) {
    return 0;
  }

  const semana = claveSemanaActual();
  const completados = await db("workout_completions")
    .where({ user_id: userId, semana_key: semana })
    .pluck("dia_id");

  return Math.round((completados.length / dias.length) * 100);
}
