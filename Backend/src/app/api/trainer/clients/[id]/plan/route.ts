import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { db } from "@/lib/db";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";

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

  const plan = planKey
    ? await db("plans")
        .where({ key: planKey })
        .andWhere((builder) => {
          builder.whereNull("trainer_id").orWhere("trainer_id", sesion.userId);
        })
        .first()
    : null;

  if (!plan) {
    return NextResponse.json({ error: "El plan indicado no es válido." }, { status: 400 });
  }

  await db("users").where({ id: clientId }).update({ plan_key: planKey });

  return NextResponse.json({ message: "Plan actualizado correctamente." });
}
