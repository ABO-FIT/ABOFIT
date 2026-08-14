import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

const LETRAS_DISPONIBLES = "CDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const PERIODICIDADES_VALIDAS = ["semanal", "mensual", "trimestral", "semestral", "anual"];

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const planes = await db("plans")
    .whereNull("trainer_id")
    .select("key", "name", "price", "includes_diet", "description", "periodicidad_key");
  return NextResponse.json({ planes });
}

export async function POST(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { name, price, includesDiet, description, periodicidadKey } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "El nombre del plan es obligatorio." }, { status: 400 });
  }
  if (typeof price !== "number" || price < 0) {
    return NextResponse.json({ error: "El precio debe ser un número positivo." }, { status: 400 });
  }
  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "La descripción es obligatoria." }, { status: 400 });
  }
  if (periodicidadKey !== undefined && !PERIODICIDADES_VALIDAS.includes(periodicidadKey as string)) {
    return NextResponse.json({ error: "La periodicidad indicada no es válida." }, { status: 400 });
  }

  const existentes = await db("plans").select("key");
  const clavesExistentes = new Set(existentes.map((p) => p.key));
  const nuevaClave = LETRAS_DISPONIBLES.find((letra) => !clavesExistentes.has(letra));

  if (!nuevaClave) {
    return NextResponse.json({ error: "No hay más claves disponibles para nuevos planes." }, { status: 409 });
  }

  const periodicidad = typeof periodicidadKey === "string" ? periodicidadKey : "mensual";

  await db("plans").insert({
    key: nuevaClave,
    name: name.trim(),
    price,
    includes_diet: !!includesDiet,
    description: description.trim(),
    periodicidad_key: periodicidad,
  });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "plan",
    targetId: 0,
    targetNombre: name,
    accion: "crear",
    despues: { key: nuevaClave, name, price, includesDiet: !!includesDiet, description, periodicidadKey: periodicidad },
  });

  return NextResponse.json({ key: nuevaClave, message: "Plan creado correctamente." }, { status: 201 });
}
