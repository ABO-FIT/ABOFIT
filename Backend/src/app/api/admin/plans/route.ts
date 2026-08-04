import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

const LETRAS_DISPONIBLES = "CDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const planes = await db("plans").select("key", "name", "price", "includes_diet", "description");
  return NextResponse.json({ planes });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { name, price, includesDiet, description } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "El nombre del plan es obligatorio." }, { status: 400 });
  }
  if (typeof price !== "number" || price < 0) {
    return NextResponse.json({ error: "El precio debe ser un número positivo." }, { status: 400 });
  }
  if (typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "La descripción es obligatoria." }, { status: 400 });
  }

  const existentes = await db("plans").select("key");
  const clavesExistentes = new Set(existentes.map((p) => p.key));
  const nuevaClave = LETRAS_DISPONIBLES.find((letra) => !clavesExistentes.has(letra));

  if (!nuevaClave) {
    return NextResponse.json({ error: "No hay más claves disponibles para nuevos planes." }, { status: 409 });
  }

  await db("plans").insert({
    key: nuevaClave,
    name: name.trim(),
    price,
    includes_diet: !!includesDiet,
    description: description.trim(),
  });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "plan",
    targetId: 0,
    targetNombre: name,
    accion: "crear",
    despues: { key: nuevaClave, name, price, includesDiet: !!includesDiet, description },
  });

  return NextResponse.json({ key: nuevaClave, message: "Plan creado correctamente." }, { status: 201 });
}
