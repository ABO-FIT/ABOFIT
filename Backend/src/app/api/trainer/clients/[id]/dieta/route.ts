import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { db } from "@/lib/db";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";
import { parsearJson } from "@/lib/json";

interface Comida {
  meal: string;
  items: string;
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

  const custom = await db("custom_diets").where({ user_id: clientId }).first();
  if (custom) {
    return NextResponse.json({ personalizada: true, nota: custom.nota, comidas: parsearJson<Comida[]>(custom.comidas) });
  }

  const porDefecto = cliente.goal_key
    ? await db("default_diets").where({ goal_key: cliente.goal_key }).first()
    : null;

  return NextResponse.json({
    personalizada: false,
    nota: porDefecto?.nota ?? "",
    comidas: porDefecto ? parsearJson<Comida[]>(porDefecto.comidas) : [],
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
  const nota = body && typeof body.nota === "string" ? body.nota.trim() : "";
  const comidas = body?.comidas;

  if (!Array.isArray(comidas) || comidas.length === 0) {
    return NextResponse.json({ error: "La dieta debe tener al menos una comida." }, { status: 400 });
  }

  for (const comida of comidas) {
    if (typeof comida.meal !== "string" || !comida.meal.trim() || typeof comida.items !== "string" || !comida.items.trim()) {
      return NextResponse.json({ error: "Cada comida debe tener nombre y contenido." }, { status: 400 });
    }
  }

  const existente = await db("custom_diets").where({ user_id: clientId }).first();
  if (existente) {
    await db("custom_diets").where({ user_id: clientId }).update({ nota, comidas: JSON.stringify(comidas), updated_at: new Date() });
  } else {
    await db("custom_diets").insert({ user_id: clientId, nota, comidas: JSON.stringify(comidas) });
  }

  return NextResponse.json({ message: "Dieta personalizada guardada." });
}
