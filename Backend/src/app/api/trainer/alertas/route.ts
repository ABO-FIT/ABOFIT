import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { obtenerPorcentajeSemana } from "@/lib/rutinaEstado";

const DIAS_SIN_PROGRESO_ALERTA = 14;
const DIAS_PAGO_VENCIDO_ALERTA = 30;
const PORCENTAJE_RUTINA_BAJO = 50;

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientes = await db("users")
    .where({ trainer_id: sesion.userId })
    .select("id", "nombre", "apellido", "usuario", "goal_key");

  const alertas = [];

  for (const cliente of clientes) {
    const motivos: string[] = [];

    const ultimoProgreso = await db("progress_entries").where({ user_id: cliente.id }).orderBy("fecha", "desc").first("fecha");
    let diasSinProgreso: number | null = null;
    if (ultimoProgreso) {
      diasSinProgreso = Math.floor((Date.now() - new Date(ultimoProgreso.fecha).getTime()) / 86400000);
      if (diasSinProgreso >= DIAS_SIN_PROGRESO_ALERTA) {
        motivos.push(`Sin registrar progreso hace ${diasSinProgreso} días.`);
      }
    }

    const porcentajeSemana = await obtenerPorcentajeSemana(cliente.id, cliente.goal_key);
    if (cliente.goal_key && porcentajeSemana < PORCENTAJE_RUTINA_BAJO) {
      motivos.push(`Cumplimiento de rutina esta semana: ${porcentajeSemana}%.`);
    }

    const pagoPendienteAntiguo = await db("payments")
      .where({ client_id: cliente.id, estado: "pendiente" })
      .orderBy("fecha", "asc")
      .first("fecha");
    let diasPagoPendiente: number | null = null;
    if (pagoPendienteAntiguo) {
      diasPagoPendiente = Math.floor((Date.now() - new Date(pagoPendienteAntiguo.fecha).getTime()) / 86400000);
      if (diasPagoPendiente >= DIAS_PAGO_VENCIDO_ALERTA) {
        motivos.push(`Pago pendiente desde hace ${diasPagoPendiente} días.`);
      }
    }

    if (motivos.length > 0) {
      alertas.push({
        clienteId: cliente.id,
        nombre: `${cliente.nombre} ${cliente.apellido}`,
        usuario: cliente.usuario,
        motivos,
        diasSinProgreso,
        porcentajeSemana,
        diasPagoPendiente,
      });
    }
  }

  return NextResponse.json({ alertas });
}
