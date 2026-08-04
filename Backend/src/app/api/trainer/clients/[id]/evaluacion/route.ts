import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { db } from "@/lib/db";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";
import { calcularSalud, libraAKg, piesAcm } from "@/lib/salud";
import { registrarAuditoria } from "@/lib/auditoria";

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
    porcentajeGrasa, porcentajeMasaMuscular,
  } = body as Record<string, unknown>;

  if (typeof porcentajeGrasa === "number" && (porcentajeGrasa < 0 || porcentajeGrasa > 75)) {
    return NextResponse.json({ error: "El porcentaje de grasa corporal no es válido." }, { status: 400 });
  }

  if (typeof porcentajeMasaMuscular === "number" && (porcentajeMasaMuscular < 0 || porcentajeMasaMuscular > 100)) {
    return NextResponse.json({ error: "El porcentaje de masa muscular no es válido." }, { status: 400 });
  }

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
    porcentaje_grasa: (porcentajeGrasa as number | undefined) ?? null,
    porcentaje_masa_muscular: (porcentajeMasaMuscular as number | undefined) ?? null,
  };

  await db("users").where({ id: clientId }).update(valores);

  await db("client_evaluations").insert({
    client_id: clientId,
    trainer_id: sesion.userId,
    ...valores,
  });

  const pesoKg = valores.peso ? (valores.peso_unidad === "lb" ? libraAKg(valores.peso) : valores.peso) : null;
  const alturaCm = valores.altura ? (valores.altura_unidad === "ft" ? piesAcm(valores.altura) : valores.altura) : null;

  const salud = calcularSalud({
    pesoKg,
    alturaCm,
    edad: valores.edad,
    sexo: valores.sexo as "male" | "female" | null,
    nivelActividad: valores.nivel_actividad,
    cintura: valores.cintura,
    cadera: valores.cadera,
    presionSistolica: valores.presion_sistolica,
    presionDiastolica: valores.presion_diastolica,
    goalKey: cliente.goal_key,
    porcentajeGrasa: valores.porcentaje_grasa,
    porcentajeMasaMuscular: valores.porcentaje_masa_muscular,
  });

  if (salud.advertenciaObjetivo) {
    const entrenador = await db("users").where({ id: sesion.userId }).first();
    await registrarAuditoria({
      adminId: sesion.userId,
      adminNombre: `${entrenador.nombre} ${entrenador.apellido}`,
      targetType: "evaluacion_riesgo",
      targetId: clientId,
      targetNombre: `${cliente.nombre} ${cliente.apellido}`,
      accion: "advertencia_objetivo_imc",
      despues: { imcClasificacion: salud.imcClasificacion, goalKey: cliente.goal_key, mensaje: salud.advertenciaObjetivo },
    });
  }

  return NextResponse.json({ message: "Evaluación guardada correctamente.", advertenciaObjetivo: salud.advertenciaObjetivo });
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
    .select("id", "peso", "peso_unidad", "altura", "altura_unidad", "edad", "sexo", "nivel_actividad", "cintura", "cadera", "presion_sistolica", "presion_diastolica", "porcentaje_grasa", "porcentaje_masa_muscular", "created_at");

  return NextResponse.json({ historial });
}
