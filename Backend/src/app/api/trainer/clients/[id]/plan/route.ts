import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { db } from "@/lib/db";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";

const PLANES_VALIDOS = ["A", "B"];

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientId = Number(params.id);
  const cliente = await obtenerClienteDelEntrenador(sesion.userId, clientId);
  if (!cliente) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const planKey = body && typeof body.planKey === "string" ? body.planKey : null;

  if (!planKey || !PLANES_VALIDOS.includes(planKey)) {
    return NextResponse.json({ error: "El plan debe ser A o B." }, { status: 400 });
  }

  await db("users").where({ id: clientId }).update({ plan_key: planKey });

  return NextResponse.json({ message: "Plan actualizado correctamente." });
}
