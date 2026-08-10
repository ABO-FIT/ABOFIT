import { db } from "@/lib/db";
import type { Knex } from "knex";

function formatoFecha(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

export interface ResultadoPagoPendiente {
  alDia: boolean;
  vigenciaHasta: string | null;
  creado: boolean;
  pago: {
    id: number;
    monto: number;
    concepto: string;
    fecha: string;
    estado: "pagado" | "pendiente";
    comprobantePath: string | null;
  } | null;
}

export interface PeriodoPago {
  periodoInicio: string;
  periodoFin: string;
  monto: number;
  concepto: string;
}

interface DatosPeriodo {
  cliente: { fecha_inicio: string | null };
  plan: { price: number; name: string };
  periodicidad: { dias: number; label: string } | undefined;
  ultimoPago: { periodo_fin: string | null } | undefined;
}

function calcularPeriodoDesdeUltimoPago(datos: DatosPeriodo): PeriodoPago {
  const { cliente, plan, periodicidad, ultimoPago } = datos;
  const dias = periodicidad?.dias ?? 30;
  const hoy = new Date();

  let periodoInicio: Date;
  if (ultimoPago?.periodo_fin) {
    periodoInicio = new Date(ultimoPago.periodo_fin);
    periodoInicio.setDate(periodoInicio.getDate() + 1);
  } else if (cliente.fecha_inicio) {
    periodoInicio = new Date(cliente.fecha_inicio);
  } else {
    periodoInicio = hoy;
  }

  const periodoFin = new Date(periodoInicio);
  periodoFin.setDate(periodoFin.getDate() + dias - 1);

  return {
    periodoInicio: formatoFecha(periodoInicio),
    periodoFin: formatoFecha(periodoFin),
    monto: plan.price,
    concepto: `Mensualidad ${periodicidad?.label ?? "Plan"} — ${plan.name}`,
  };
}

/**
 * Calcula el período que le corresponde cubrir al próximo pago de un cliente,
 * según la periodicidad de su plan. No inserta nada — la usa el registro manual
 * de un pago "pagado" por el entrenador, para que quede de acuerdo con el cobro
 * automático sobre qué período cubre cada pago (evita que ambos caminos generen
 * cobros duplicados para el mismo ciclo).
 */
export async function calcularProximoPeriodo(clientId: number, trx: Knex = db): Promise<PeriodoPago | null> {
  const cliente = await trx("users").where({ id: clientId }).first();
  if (!cliente?.plan_key || !cliente.trainer_id) {
    return null;
  }

  const plan = await trx("plans").where({ key: cliente.plan_key }).first();
  if (!plan) {
    return null;
  }

  const periodicidad = await trx("periodicidades").where({ key: plan.periodicidad_key }).first();

  const ultimoPago = await trx("payments")
    .where({ client_id: clientId, estado: "pagado" })
    .whereNotNull("periodo_fin")
    .orderBy("periodo_fin", "desc")
    .first();

  return calcularPeriodoDesdeUltimoPago({ cliente, plan, periodicidad, ultimoPago });
}

export async function obtenerOCrearPagoPendiente(clientId: number): Promise<ResultadoPagoPendiente | null> {
  return db.transaction(async (trx) => {
    // Bloquea la fila del cliente para serializar llamadas concurrentes
    // (dos pestañas, doble clic, o el cron corriendo al mismo tiempo que
    // el cliente entra a la pantalla) y evitar cobros pendientes duplicados.
    await trx("users").where({ id: clientId }).forUpdate().first();

    const pendiente = await trx("payments")
      .where({ client_id: clientId, estado: "pendiente" })
      .orderBy("fecha", "desc")
      .first();

    if (pendiente) {
      return {
        alDia: false,
        vigenciaHasta: null,
        creado: false,
        pago: {
          id: pendiente.id,
          monto: pendiente.monto,
          concepto: pendiente.concepto,
          fecha: pendiente.fecha,
          estado: pendiente.estado,
          comprobantePath: pendiente.comprobante_path,
        },
      };
    }

    const cliente = await trx("users").where({ id: clientId }).first();
    if (!cliente?.plan_key || !cliente.trainer_id) {
      return null;
    }

    const plan = await trx("plans").where({ key: cliente.plan_key }).first();
    if (!plan) {
      return null;
    }

    const periodicidad = await trx("periodicidades").where({ key: plan.periodicidad_key }).first();

    const ultimoPago = await trx("payments")
      .where({ client_id: clientId, estado: "pagado" })
      .whereNotNull("periodo_fin")
      .orderBy("periodo_fin", "desc")
      .first();

    const hoy = new Date();

    if (ultimoPago?.estado === "pagado" && ultimoPago.periodo_fin && new Date(ultimoPago.periodo_fin) >= hoy) {
      return { alDia: true, vigenciaHasta: ultimoPago.periodo_fin, creado: false, pago: null };
    }

    const periodo = calcularPeriodoDesdeUltimoPago({ cliente, plan, periodicidad, ultimoPago });

    const [id] = await trx("payments").insert({
      client_id: clientId,
      trainer_id: cliente.trainer_id,
      monto: periodo.monto,
      concepto: periodo.concepto,
      fecha: formatoFecha(hoy),
      estado: "pendiente",
      periodo_inicio: periodo.periodoInicio,
      periodo_fin: periodo.periodoFin,
    });

    const nuevo = await trx("payments").where({ id }).first();

    return {
      alDia: false,
      vigenciaHasta: null,
      creado: true,
      pago: {
        id: nuevo.id,
        monto: nuevo.monto,
        concepto: nuevo.concepto,
        fecha: nuevo.fecha,
        estado: nuevo.estado,
        comprobantePath: nuevo.comprobante_path,
      },
    };
  });
}
