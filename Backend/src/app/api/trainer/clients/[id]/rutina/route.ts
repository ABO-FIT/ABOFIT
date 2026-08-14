import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { db } from "@/lib/db";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";
import { parsearJson } from "@/lib/json";

interface DiaRutina {
  id: string;
  day: string;
  focus: string;
  exercises: string[];
}

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

  const custom = await db("custom_routines").where({ user_id: clientId }).first();
  if (custom) {
    return NextResponse.json({ personalizada: true, dias: parsearJson<DiaRutina[]>(custom.contenido) });
  }

  const porDefecto = cliente.goal_key
    ? await db("default_routines").where({ goal_key: cliente.goal_key }).first()
    : null;

  return NextResponse.json({
    personalizada: false,
    dias: porDefecto ? parsearJson<DiaRutina[]>(porDefecto.contenido) : [],
  });
}

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
  const dias = body?.dias;

  if (!Array.isArray(dias) || dias.length === 0) {
    return NextResponse.json({ error: "La rutina debe tener al menos un día." }, { status: 400 });
  }

  for (const dia of dias) {
    if (
      typeof dia.id !== "string" || !dia.id.trim() ||
      typeof dia.day !== "string" || !dia.day.trim() ||
      typeof dia.focus !== "string" || !dia.focus.trim() ||
      !Array.isArray(dia.exercises) || dia.exercises.some((ej: unknown) => typeof ej !== "string" || !ej.trim())
    ) {
      return NextResponse.json({ error: "Cada día debe tener id, día, enfoque y una lista de ejercicios." }, { status: 400 });
    }
  }

  const existente = await db("custom_routines").where({ user_id: clientId }).first();
  if (existente) {
    await db("custom_routines").where({ user_id: clientId }).update({ contenido: JSON.stringify(dias), updated_at: new Date() });
  } else {
    await db("custom_routines").insert({ user_id: clientId, contenido: JSON.stringify(dias) });
  }

  return NextResponse.json({ message: "Rutina personalizada guardada." });
}
