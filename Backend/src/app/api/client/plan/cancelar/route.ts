import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { aplicarCancelacion } from "@/lib/cancelacionPlan";

export async function POST(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const cliente = await db("users").where({ id: sesion.userId }).first();
  if (!cliente?.plan_key) {
    return NextResponse.json({ error: "No tienes un plan asignado." }, { status: 400 });
  }

  if (cliente.plan_cancelado_en) {
    return NextResponse.json({ error: "Tu plan ya está en proceso de cancelación." }, { status: 409 });
  }

  const pagoPendiente = await db("payments").where({ client_id: sesion.userId, estado: "pendiente" }).first();
  if (pagoPendiente) {
    return NextResponse.json({ error: "Tienes un pago pendiente. Resuélvelo con tu entrenador antes de cancelar." }, { status: 409 });
  }

  const { vigenteHasta } = await aplicarCancelacion({ clientId: sesion.userId, por: "cliente" });

  return NextResponse.json({ message: "Tu plan quedó marcado para cancelación.", vigenteHasta });
}
