import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
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

  const plantillas = await db("routine_templates")
    .where({ trainer_id: sesion.userId })
    .orderBy("created_at", "desc")
    .select("id", "nombre", "contenido");

  return NextResponse.json({
    plantillas: plantillas.map((p) => ({ id: p.id, nombre: p.nombre, dias: parsearJson<DiaRutina[]>(p.contenido) })),
  });
}

export async function POST(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.nombre !== "string" || !Array.isArray(body.dias)) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const nombre = body.nombre.trim();
  if (!nombre) {
    return NextResponse.json({ error: "El nombre de la plantilla es obligatorio." }, { status: 400 });
  }

  const dias = body.dias as DiaRutina[];
  const diasValidos = dias.every(
    (dia) =>
      typeof dia.id === "string" &&
      dia.id.trim() &&
      typeof dia.day === "string" &&
      dia.day.trim() &&
      typeof dia.focus === "string" &&
      dia.focus.trim() &&
      Array.isArray(dia.exercises) &&
      dia.exercises.every((ej) => typeof ej === "string" && ej.trim())
  );

  if (dias.length === 0 || !diasValidos) {
    return NextResponse.json({ error: "La rutina debe tener al menos un día válido." }, { status: 400 });
  }

  const [id] = await db("routine_templates").insert({
    trainer_id: sesion.userId,
    nombre,
    contenido: JSON.stringify(dias),
  });

  return NextResponse.json({ id, message: "Plantilla guardada." }, { status: 201 });
}
