import { db } from "@/lib/db";
import { crearNotificacion } from "@/lib/notificaciones";

const TIPO_RECORDATORIO_PROGRESO = "recordatorio_progreso";
const DIAS_SIN_REGISTRO_PARA_RECORDAR = 7;

export async function generarRecordatoriosCliente(userId: number): Promise<void> {
  const ultimaEntrada = await db("progress_entries").where({ user_id: userId }).orderBy("fecha", "desc").first();
  if (!ultimaEntrada) {
    return;
  }

  const diasSinRegistrar = Math.floor((Date.now() - new Date(ultimaEntrada.fecha).getTime()) / 86400000);
  if (diasSinRegistrar < DIAS_SIN_REGISTRO_PARA_RECORDAR) {
    return;
  }

  const sieteDiasAtras = new Date();
  sieteDiasAtras.setDate(sieteDiasAtras.getDate() - DIAS_SIN_REGISTRO_PARA_RECORDAR);

  const recordatorioReciente = await db("notifications")
    .where({ user_id: userId, tipo: TIPO_RECORDATORIO_PROGRESO })
    .andWhere("created_at", ">=", sieteDiasAtras)
    .first();

  if (recordatorioReciente) {
    return;
  }

  await crearNotificacion({
    userId,
    tipo: TIPO_RECORDATORIO_PROGRESO,
    titulo: "No has registrado tu progreso",
    subtitulo: `Han pasado ${diasSinRegistrar} días desde tu último registro.`,
    link: "/portal/mi-progreso",
  });
}
