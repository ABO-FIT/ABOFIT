import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";
import { crearNotificacion } from "@/lib/notificaciones";

export async function PUT(request: Request, { params }: { params: { id: string; pagoId: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientId = Number(params.id);
  const cliente = await obtenerClienteDelEntrenador(sesion.userId, clientId);
  if (!cliente) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  const pago = await db("payments").where({ id: Number(params.pagoId), client_id: clientId }).first();
  if (!pago) {
    return NextResponse.json({ error: "Pago no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const estado = body && typeof body.estado === "string" ? body.estado : null;

  if (!estado || !["pagado", "pendiente"].includes(estado)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  await db("payments").where({ id: pago.id }).update({ estado });

  if (estado !== pago.estado) {
    await crearNotificacion({
      userId: clientId,
      tipo: "pago",
      titulo: estado === "pagado" ? `Pago confirmado: ${pago.concepto}` : `Pago marcado pendiente: ${pago.concepto}`,
      link: "/portal/pagos",
    });
  }

  return NextResponse.json({ message: "Pago actualizado correctamente." });
}
