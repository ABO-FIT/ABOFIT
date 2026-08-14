import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { claveSemanaActual } from "@/lib/semana";
import { parsearJson } from "@/lib/json";

interface DiaRutina {
  id: string;
  day: string;
  focus: string;
  exercises: string[];
}

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientes = await db("users").where({ trainer_id: sesion.userId }).select("id", "plan_key", "goal_key");

  const totalClientes = clientes.length;
  const clientesPlanB = clientes.filter((c) => c.plan_key === "B").length;

  const mensajesSinLeer = await db("messages")
    .whereIn("client_id", clientes.map((c) => c.id))
    .andWhere({ remitente: "cliente", leido: false })
    .count("id as total")
    .first<{ total: number } | undefined>();

  const semana = claveSemanaActual();
  let sumaPorcentajes = 0;
  let clientesConRutina = 0;

  for (const cliente of clientes) {
    if (!cliente.goal_key) continue;

    const rutinaCustom = await db("custom_routines").where({ user_id: cliente.id }).first();
    const rutinaDefault = rutinaCustom ? null : await db("default_routines").where({ goal_key: cliente.goal_key }).first();
    const rutina = rutinaCustom ?? rutinaDefault;
    const dias = rutina ? parsearJson<DiaRutina[]>(rutina.contenido) : [];

    if (dias.length === 0) continue;

    const completados = await db("workout_completions")
      .where({ user_id: cliente.id, semana_key: semana })
      .count("id as total")
      .first<{ total: number } | undefined>();

    sumaPorcentajes += Math.round((Number(completados?.total ?? 0) / dias.length) * 100);
    clientesConRutina += 1;
  }

  const cumplimientoPromedio = clientesConRutina > 0 ? Math.round(sumaPorcentajes / clientesConRutina) : 0;

  return NextResponse.json({
    totalClientes,
    clientesPlanB,
    mensajesSinLeer: Number(mensajesSinLeer?.total ?? 0),
    cumplimientoPromedio,
  });
}
