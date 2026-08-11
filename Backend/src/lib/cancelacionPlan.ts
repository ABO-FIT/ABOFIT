import { db } from "@/lib/db";
import { crearNotificacion } from "@/lib/notificaciones";

function formatoFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

/**
 * Calcula hasta cuándo mantiene acceso el cliente si cancela hoy: si tiene
 * un pago "pagado" cuyo período todavía no vence, conserva el plan hasta esa
 * fecha (no hay reembolso); si no, la cancelación es efectiva de inmediato.
 */
export async function calcularVigenciaHastaCancelacion(clientId: number): Promise<string> {
  const hoy = new Date();
  const ultimoPago = await db("payments")
    .where({ client_id: clientId, estado: "pagado" })
    .whereNotNull("periodo_fin")
    .andWhere("periodo_fin", ">=", formatoFecha(hoy))
    .orderBy("periodo_fin", "desc")
    .first();

  return ultimoPago?.periodo_fin ? formatoFecha(new Date(ultimoPago.periodo_fin)) : formatoFecha(hoy);
}

export async function aplicarCancelacion(params: {
  clientId: number;
  por: "cliente" | "entrenador";
  motivo?: string | null;
}): Promise<{ vigenteHasta: string }> {
  const vigenteHasta = await calcularVigenciaHastaCancelacion(params.clientId);

  await db("users").where({ id: params.clientId }).update({
    plan_cancelado_en: db.fn.now(),
    plan_vigente_hasta: vigenteHasta,
    plan_cancelado_por: params.por,
    plan_cancelado_motivo: params.motivo ?? null,
  });

  const cliente = await db("users").where({ id: params.clientId }).first();
  const vigenteHastaTexto = new Date(vigenteHasta).toLocaleDateString("es-DO");

  if (params.por === "cliente" && cliente?.trainer_id) {
    await crearNotificacion({
      userId: cliente.trainer_id,
      tipo: "cancelacion",
      titulo: `${cliente.nombre} ${cliente.apellido} canceló su plan`,
      subtitulo: `Mantiene acceso hasta el ${vigenteHastaTexto}.`,
      link: `/entrenador/clientes/${params.clientId}`,
    });
  }

  if (params.por === "entrenador") {
    await crearNotificacion({
      userId: params.clientId,
      tipo: "cancelacion",
      titulo: "Tu entrenador canceló tu plan",
      subtitulo: params.motivo ? `Motivo: ${params.motivo}` : undefined,
      link: "/portal/mi-plan",
    });
  }

  return { vigenteHasta };
}

/**
 * Finaliza las cancelaciones cuya vigencia ya venció: le quita el plan al
 * cliente y limpia los campos de cancelación. La usa el cron diario.
 */
export async function finalizarCancelacionesVencidas(): Promise<number> {
  const hoy = new Date().toISOString().slice(0, 10);

  const clientes = await db("users")
    .whereNotNull("plan_cancelado_en")
    .andWhere("plan_vigente_hasta", "<=", hoy)
    .select("id", "nombre", "apellido");

  let finalizadas = 0;
  for (const cliente of clientes) {
    try {
      await db("users").where({ id: cliente.id }).update({
        plan_key: null,
        plan_cancelado_en: null,
        plan_vigente_hasta: null,
        plan_cancelado_por: null,
        plan_cancelado_motivo: null,
      });
      await crearNotificacion({
        userId: cliente.id,
        tipo: "cancelacion",
        titulo: "Tu plan ha finalizado",
        subtitulo: "La cancelación de tu plan ya es efectiva.",
        link: "/portal/mi-plan",
      });
      finalizadas += 1;
    } catch (error) {
      console.error(`Error finalizando cancelación del cliente ${cliente.id}:`, error);
    }
  }

  return finalizadas;
}
