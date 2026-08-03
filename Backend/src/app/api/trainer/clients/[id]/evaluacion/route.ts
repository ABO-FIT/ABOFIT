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

  await db("users")
    .where({ id: clientId })
    .update({
      peso: peso ?? null,
      peso_unidad: pesoUnidad ?? "kg",
      altura: altura ?? null,
      altura_unidad: alturaUnidad ?? "cm",
      edad: edad ?? null,
      sexo: sexo ?? null,
      nivel_actividad: nivelActividad ?? null,
      cintura: cintura ?? null,
      cadera: cadera ?? null,
      presion_sistolica: presionSistolica ?? null,
      presion_diastolica: presionDiastolica ?? null,
    });

  return NextResponse.json({ message: "Evaluación guardada correctamente." });
}
