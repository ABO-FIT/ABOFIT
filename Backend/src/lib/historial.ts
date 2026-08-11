import { db } from "@/lib/db";

/**
 * Registra en el historial permanente que el cliente marcó como completado
 * un día de rutina o una comida del plan de alimentación, en la fecha de hoy.
 * Es idempotente por día (si ya existe un registro para ese mismo día y
 * referencia, no se duplica). A diferencia de workout_completions/
 * diet_completions, estas filas nunca se borran al desmarcar — son el
 * registro histórico permanente.
 */
export async function registrarHistorial(params: {
  userId: number;
  tipo: "rutina" | "dieta";
  referencia: string;
  etiqueta: string;
}): Promise<void> {
  const fecha = new Date().toISOString().slice(0, 10);
  try {
    await db("historial_completados").insert({
      user_id: params.userId,
      tipo: params.tipo,
      fecha,
      referencia: params.referencia,
      etiqueta: params.etiqueta,
    });
  } catch {
    // Ya existía un registro para este día (constraint único) — no es un error.
  }
}
