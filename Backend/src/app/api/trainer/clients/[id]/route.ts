import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";
import { calcularSalud, libraAKg, piesAcm } from "@/lib/salud";
import { claveSemanaActual } from "@/lib/semana";
import { parsearJson } from "@/lib/json";

interface DiaRutina {
  id: string;
  day: string;
  focus: string;
  exercises: string[];
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientId = Number(params.id);
  const cliente = await obtenerClienteDelEntrenador(sesion.userId, clientId);

  if (!cliente) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  const pesoKg = cliente.peso ? (cliente.peso_unidad === "lb" ? libraAKg(Number(cliente.peso)) : Number(cliente.peso)) : null;
  const alturaCm = cliente.altura ? (cliente.altura_unidad === "ft" ? piesAcm(Number(cliente.altura)) : Number(cliente.altura)) : null;

  const salud = calcularSalud({
    pesoKg,
    alturaCm,
    edad: cliente.edad,
    sexo: cliente.sexo,
    nivelActividad: cliente.nivel_actividad,
    cintura: cliente.cintura ? Number(cliente.cintura) : null,
    cadera: cliente.cadera ? Number(cliente.cadera) : null,
    presionSistolica: cliente.presion_sistolica,
    presionDiastolica: cliente.presion_diastolica,
    goalKey: cliente.goal_key,
    porcentajeGrasa: cliente.porcentaje_grasa ? Number(cliente.porcentaje_grasa) : null,
    porcentajeMasaMuscular: cliente.porcentaje_masa_muscular ? Number(cliente.porcentaje_masa_muscular) : null,
  });

  let porcentajeSemana = 0;
  if (cliente.goal_key) {
    const rutinaCustom = await db("custom_routines").where({ user_id: clientId }).first();
    const rutinaDefault = await db("default_routines").where({ goal_key: cliente.goal_key }).first();
    const dias = rutinaCustom
      ? parsearJson<DiaRutina[]>(rutinaCustom.contenido)
      : rutinaDefault
        ? parsearJson<DiaRutina[]>(rutinaDefault.contenido)
        : [];

    const semana = claveSemanaActual();
    const completados = await db("workout_completions")
      .where({ user_id: clientId, semana_key: semana })
      .count("id as total")
      .first<{ total: number } | undefined>();
    porcentajeSemana = dias.length > 0 ? Math.round((Number(completados?.total ?? 0) / dias.length) * 100) : 0;
  }

  const progreso = await db("progress_entries")
    .where({ user_id: clientId })
    .orderBy("fecha", "desc")
    .select("id", "fecha", "peso", "cintura", "nota", "foto_path");

  return NextResponse.json({
    cliente: {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      correo: cliente.correo,
      usuario: cliente.usuario,
      telefono: cliente.telefono,
      planKey: cliente.plan_key,
      goalKey: cliente.goal_key,
      fechaInicio: cliente.fecha_inicio,
      peso: cliente.peso,
      pesoUnidad: cliente.peso_unidad,
      altura: cliente.altura,
      alturaUnidad: cliente.altura_unidad,
      edad: cliente.edad,
      sexo: cliente.sexo,
      nivelActividad: cliente.nivel_actividad,
      cintura: cliente.cintura,
      cadera: cliente.cadera,
      presionSistolica: cliente.presion_sistolica,
      presionDiastolica: cliente.presion_diastolica,
      porcentajeGrasa: cliente.porcentaje_grasa,
      porcentajeMasaMuscular: cliente.porcentaje_masa_muscular,
      cancelacion: cliente.plan_cancelado_en
        ? { vigenteHasta: cliente.plan_vigente_hasta, por: cliente.plan_cancelado_por, motivo: cliente.plan_cancelado_motivo }
        : null,
    },
    salud,
    porcentajeSemana,
    progreso,
  });
}
