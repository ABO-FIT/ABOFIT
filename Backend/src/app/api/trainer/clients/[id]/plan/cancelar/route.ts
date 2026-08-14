import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";
import { aplicarCancelacion } from "@/lib/cancelacionPlan";

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

  if (!cliente.plan_key) {
    return NextResponse.json({ error: "Este cliente no tiene un plan asignado." }, { status: 400 });
  }

  if (cliente.plan_cancelado_en) {
    return NextResponse.json({ error: "El plan de este cliente ya está en proceso de cancelación." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const motivo = body && typeof body.motivo === "string" ? body.motivo.trim() : "";

  if (!motivo) {
    return NextResponse.json({ error: "Debes justificar el motivo de la cancelación." }, { status: 400 });
  }

  const { vigenteHasta } = await aplicarCancelacion({ clientId, por: "entrenador", motivo });

  return NextResponse.json({ message: "Plan cancelado correctamente.", vigenteHasta });
}
