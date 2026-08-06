import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

const PERIODICIDADES_VALIDAS = ["semanal", "mensual", "trimestral", "semestral", "anual"];

async function generarClavePlan(): Promise<string> {
  let clave = "";
  let existe = true;
  while (existe) {
    clave = randomBytes(4).toString("hex");
    existe = !!(await db("plans").where({ key: clave }).first());
  }
  return clave;
}

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const planes = await db("plans")
    .where({ trainer_id: sesion.userId })
    .select("key", "name", "price", "includes_diet", "description", "periodicidad_key");

  return NextResponse.json({ planes });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
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

  const periodicidad = typeof periodicidadKey === "string" ? periodicidadKey : "mensual";
  const nuevaClave = await generarClavePlan();

  await db("plans").insert({
    key: nuevaClave,
    name: name.trim(),
    price,
    includes_diet: !!includesDiet,
    description: description.trim(),
    periodicidad_key: periodicidad,
    trainer_id: sesion.userId,
  });

  const entrenador = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${entrenador.nombre} ${entrenador.apellido}`,
    targetType: "plan",
    targetId: 0,
    targetNombre: name,
    accion: "crear",
    despues: { key: nuevaClave, name, price, includesDiet: !!includesDiet, description, periodicidadKey: periodicidad },
  });

  return NextResponse.json({ key: nuevaClave, message: "Plan creado correctamente." }, { status: 201 });
}
