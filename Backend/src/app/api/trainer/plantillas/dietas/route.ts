import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { parsearJson } from "@/lib/json";

interface Comida {
  meal: string;
  items: string;
}

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const plantillas = await db("diet_templates")
    .where({ trainer_id: sesion.userId })
    .orderBy("created_at", "desc")
    .select("id", "nombre", "nota", "comidas");

  return NextResponse.json({
    plantillas: plantillas.map((p) => ({ id: p.id, nombre: p.nombre, nota: p.nota, comidas: parsearJson<Comida[]>(p.comidas) })),
  });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body.nombre !== "string" || typeof body.nota !== "string" || !Array.isArray(body.comidas)) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const nombre = body.nombre.trim();
  if (!nombre) {
    return NextResponse.json({ error: "El nombre de la plantilla es obligatorio." }, { status: 400 });
  }

  const comidas = body.comidas as Comida[];
  const comidasValidas = comidas.every(
    (c) => typeof c.meal === "string" && c.meal.trim() && typeof c.items === "string" && c.items.trim()
  );

  if (comidas.length === 0 || !comidasValidas) {
    return NextResponse.json({ error: "La dieta debe tener al menos una comida válida." }, { status: 400 });
  }

  const [id] = await db("diet_templates").insert({
    trainer_id: sesion.userId,
    nombre,
    nota: body.nota.trim(),
    comidas: JSON.stringify(comidas),
  });

  return NextResponse.json({ id, message: "Plantilla guardada." }, { status: 201 });
}
