import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { obtenerComidasAsignadas } from "@/lib/dietaEstado";
import { registrarHistorial } from "@/lib/historial";

export async function POST(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.meal !== "string" || !body.meal.trim()) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const meal = body.meal.trim();

  const comidas = await obtenerComidasAsignadas(sesion.userId);
  if (!comidas.some((c) => c.meal === meal)) {
    return NextResponse.json({ error: "Esa comida no pertenece a tu plan de alimentación." }, { status: 400 });
  }

  const fecha = new Date().toISOString().slice(0, 10);

  const existente = await db("diet_completions").where({ user_id: sesion.userId, fecha, meal }).first();

  if (existente) {
    await db("diet_completions").where({ id: existente.id }).delete();
    return NextResponse.json({ completado: false });
  }

  await db("diet_completions").insert({ user_id: sesion.userId, fecha, meal });
  await registrarHistorial({ userId: sesion.userId, tipo: "dieta", referencia: meal, etiqueta: meal });
  return NextResponse.json({ completado: true });
}
