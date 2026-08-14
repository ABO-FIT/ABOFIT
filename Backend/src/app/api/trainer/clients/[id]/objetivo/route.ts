import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { db } from "@/lib/db";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";

const OBJETIVOS_VALIDOS = ["masa", "grasa", "mantenimiento", "rendimiento"];

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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
  const goalKey = body && typeof body.goalKey === "string" ? body.goalKey : null;

  if (!goalKey || !OBJETIVOS_VALIDOS.includes(goalKey)) {
    return NextResponse.json({ error: "El objetivo indicado no es válido." }, { status: 400 });
  }

  await db("users").where({ id: clientId }).update({ goal_key: goalKey });

  return NextResponse.json({ message: "Objetivo actualizado correctamente." });
}
