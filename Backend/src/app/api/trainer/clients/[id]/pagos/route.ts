import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";
import { crearNotificacion } from "@/lib/notificaciones";
import { calcularProximoPeriodo } from "@/lib/pagosPlan";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientId = Number(params.id);
  const cliente = await obtenerClienteDelEntrenador(sesion.userId, clientId);
  if (!cliente) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  const pagos = await db("payments")
    .where({ client_id: clientId })
    .orderBy("fecha", "desc")
    .select("id", "monto", "concepto", "fecha", "estado", "comprobante_path");

  return NextResponse.json({ pagos });
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientId = Number(params.id);
  const cliente = await obtenerClienteDelEntrenador(sesion.userId, clientId);
  if (!cliente) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const { monto, concepto, fecha, estado } = (body ?? {}) as Record<string, unknown>;

  if (typeof monto !== "number" || monto <= 0) {
    return NextResponse.json({ error: "El monto debe ser un número positivo." }, { status: 400 });
  }
  if (typeof concepto !== "string" || !concepto.trim()) {
    return NextResponse.json({ error: "El concepto es obligatorio." }, { status: 400 });
  }
  if (typeof fecha !== "string" || !fecha.trim()) {
    return NextResponse.json({ error: "La fecha es obligatoria." }, { status: 400 });
  }
  const estadoFinal = estado === "pagado" ? "pagado" : "pendiente";

  // Si se registra como pagado y el cliente tiene un plan con periodicidad, se le
  // asigna el período que cubre — así el cobro automático no vuelve a generar un
  // cargo pendiente para el mismo ciclo ya pagado en efectivo/manualmente.
  const periodo = estadoFinal === "pagado" ? await calcularProximoPeriodo(clientId) : null;

  const [id] = await db("payments").insert({
    client_id: clientId,
    trainer_id: sesion.userId,
    monto,
    concepto: concepto.trim(),
    fecha,
    estado: estadoFinal,
    periodo_inicio: periodo?.periodoInicio ?? null,
    periodo_fin: periodo?.periodoFin ?? null,
  });

  await crearNotificacion({
    userId: clientId,
    tipo: "pago",
    titulo: estadoFinal === "pagado" ? `Pago registrado: ${concepto.trim()}` : `Pago pendiente: ${concepto.trim()}`,
    subtitulo: `Monto: RD$${monto.toLocaleString("es-DO")}`,
    link: "/portal/pagos",
  });

  return NextResponse.json({ id, message: "Pago registrado correctamente." }, { status: 201 });
}
