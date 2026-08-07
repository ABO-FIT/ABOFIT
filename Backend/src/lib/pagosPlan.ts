import { db } from "@/lib/db";

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

export async function obtenerOCrearPagoPendiente(clientId: number): Promise<ResultadoPagoPendiente | null> {
  const pendiente = await db("payments")
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

  const cliente = await db("users").where({ id: clientId }).first();
  if (!cliente?.plan_key || !cliente.trainer_id) {
    return null;
  }

  const plan = await db("plans").where({ key: cliente.plan_key }).first();
  if (!plan) {
    return null;
  }

  const periodicidad = await db("periodicidades").where({ key: plan.periodicidad_key }).first();
  const dias = periodicidad?.dias ?? 30;

  const ultimoPago = await db("payments")
    .where({ client_id: clientId })
    .whereNotNull("periodo_fin")
    .orderBy("periodo_fin", "desc")
    .first();

  const hoy = new Date();

  if (ultimoPago?.estado === "pagado" && ultimoPago.periodo_fin && new Date(ultimoPago.periodo_fin) >= hoy) {
    return { alDia: true, vigenciaHasta: ultimoPago.periodo_fin, creado: false, pago: null };
  }

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

  const concepto = `Mensualidad ${periodicidad?.label ?? "Plan"} — ${plan.name}`;

  const [id] = await db("payments").insert({
    client_id: clientId,
    trainer_id: cliente.trainer_id,
    monto: plan.price,
    concepto,
    fecha: formatoFecha(hoy),
    estado: "pendiente",
    periodo_inicio: formatoFecha(periodoInicio),
    periodo_fin: formatoFecha(periodoFin),
  });

  const nuevo = await db("payments").where({ id }).first();

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
}
