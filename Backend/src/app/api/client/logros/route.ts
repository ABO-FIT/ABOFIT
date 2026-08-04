import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { parsearJson } from "@/lib/json";
import { claveSemanaActual } from "@/lib/semana";

interface DiaRutina {
  id: string;
}

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const usuario = await db("users").where({ id: sesion.userId }).first();

  const treintaDiasAtras = new Date();
  treintaDiasAtras.setDate(treintaDiasAtras.getDate() - 30);

  const [registrosProgreso, semanasActivas, rutina] = await Promise.all([
    db("progress_entries")
      .where({ user_id: sesion.userId })
      .andWhere("fecha", ">=", treintaDiasAtras.toISOString().slice(0, 10))
      .count<{ total: number }[]>({ total: "*" })
      .then((r) => Number(r[0]?.total ?? 0)),
    db("workout_completions")
      .where({ user_id: sesion.userId })
      .countDistinct<{ total: number }[]>({ total: "semana_key" })
      .then((r) => Number(r[0]?.total ?? 0)),
    usuario.goal_key
      ? db("custom_routines").where({ user_id: sesion.userId }).first().then(
          async (custom) => custom ?? db("default_routines").where({ goal_key: usuario.goal_key }).first()
        )
      : null,
  ]);

  let rutinaSemanaCompleta = false;
  if (rutina) {
    const dias = parsearJson<DiaRutina[]>(rutina.contenido);
    const semana = claveSemanaActual();
    const completados = await db("workout_completions")
      .where({ user_id: sesion.userId, semana_key: semana })
      .pluck("dia_id");
    rutinaSemanaCompleta = dias.length > 0 && completados.length >= dias.length;
  }

  const logros = [
    {
      id: "racha_semanal",
      titulo: "Semana completa",
      descripcion: "Completa todos los días de tu rutina en la semana actual.",
      conseguido: rutinaSemanaCompleta,
    },
    {
      id: "constancia",
      titulo: "Constancia",
      descripcion: "Registra tu progreso al menos 3 veces en los últimos 30 días.",
      conseguido: registrosProgreso >= 3,
    },
    {
      id: "comprometido",
      titulo: "Comprometido",
      descripcion: "Completa al menos un entrenamiento en 4 semanas distintas.",
      conseguido: semanasActivas >= 4,
    },
  ];

  return NextResponse.json({ logros });
}
