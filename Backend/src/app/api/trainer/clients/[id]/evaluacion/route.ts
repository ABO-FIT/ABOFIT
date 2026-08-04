import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { db } from "@/lib/db";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";

const NIVELES_ACTIVIDAD = ["sedentario", "ligero", "moderado", "activo", "muy_activo"];

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
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const {
    peso, pesoUnidad, altura, alturaUnidad, edad, sexo, nivelActividad,
    cintura, cadera, presionSistolica, presionDiastolica,
  } = body as Record<string, unknown>;

  if (pesoUnidad && !["kg", "lb"].includes(pesoUnidad as string)) {
    return NextResponse.json({ error: "Unidad de peso inválida." }, { status: 400 });
  }

  if (alturaUnidad && !["cm", "ft"].includes(alturaUnidad as string)) {
    return NextResponse.json({ error: "Unidad de altura inválida." }, { status: 400 });
  }

  if (sexo && !["male", "female"].includes(sexo as string)) {
    return NextResponse.json({ error: "Sexo inválido." }, { status: 400 });
  }

  if (nivelActividad && !NIVELES_ACTIVIDAD.includes(nivelActividad as string)) {
    return NextResponse.json({ error: "Nivel de actividad inválido." }, { status: 400 });
  }

  const valores = {
    peso: (peso as number | undefined) ?? null,
    peso_unidad: (pesoUnidad as string | undefined) ?? "kg",
    altura: (altura as number | undefined) ?? null,
    altura_unidad: (alturaUnidad as string | undefined) ?? "cm",
    edad: (edad as number | undefined) ?? null,
    sexo: (sexo as string | undefined) ?? null,
    nivel_actividad: (nivelActividad as string | undefined) ?? null,
    cintura: (cintura as number | undefined) ?? null,
    cadera: (cadera as number | undefined) ?? null,
    presion_sistolica: (presionSistolica as number | undefined) ?? null,
    presion_diastolica: (presionDiastolica as number | undefined) ?? null,
  };

  await db("users").where({ id: clientId }).update(valores);

  await db("client_evaluations").insert({
    client_id: clientId,
    trainer_id: sesion.userId,
    ...valores,
  });

  return NextResponse.json({ message: "Evaluación guardada correctamente." });
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

  const historial = await db("client_evaluations")
    .where({ client_id: clientId })
    .orderBy("created_at", "desc")
    .select("id", "peso", "peso_unidad", "altura", "altura_unidad", "edad", "sexo", "nivel_actividad", "cintura", "cadera", "presion_sistolica", "presion_diastolica", "created_at");

  return NextResponse.json({ historial });
}
