import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

const PERIODICIDADES_VALIDAS = ["semanal", "mensual", "trimestral", "semestral", "anual"];

function parsearBeneficios(valor: unknown): string[] | null {
  if (valor === undefined) return null;
  if (!Array.isArray(valor)) return null;
  return valor.filter((b): b is string => typeof b === "string" && b.trim().length > 0).map((b) => b.trim());
}

export async function PUT(request: Request, { params }: { params: { key: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const anterior = await db("plans").where({ key: params.key }).first();
  if (!anterior || anterior.trainer_id !== sesion.userId) {
    return NextResponse.json({ error: "Plan no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const { name, price, includesDiet, description, periodicidadKey, beneficios } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim() || typeof price !== "number" || price < 0 || typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "Nombre, precio y descripción son obligatorios." }, { status: 400 });
  }
  if (periodicidadKey !== undefined && !PERIODICIDADES_VALIDAS.includes(periodicidadKey as string)) {
    return NextResponse.json({ error: "La periodicidad indicada no es válida." }, { status: 400 });
  }

  const listaBeneficios = parsearBeneficios(beneficios);

  const despues = {
    name: name.trim(),
    price,
    includes_diet: !!includesDiet,
    description: description.trim(),
    periodicidad_key: typeof periodicidadKey === "string" ? periodicidadKey : anterior.periodicidad_key,
    beneficios: JSON.stringify(listaBeneficios ?? []),
  };
  await db("plans").where({ key: params.key }).update(despues);

  const entrenador = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${entrenador.nombre} ${entrenador.apellido}`,
    targetType: "plan",
    targetId: 0,
    targetNombre: `Plan ${params.key}`,
    accion: "editar",
    antes: anterior,
    despues,
  });

  return NextResponse.json({ message: "Plan actualizado correctamente." });
}

export async function DELETE(request: Request, { params }: { params: { key: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const plan = await db("plans").where({ key: params.key }).first();
  if (!plan || plan.trainer_id !== sesion.userId) {
    return NextResponse.json({ error: "Plan no encontrado." }, { status: 404 });
  }

  const clientesConEstePlan = await db("users").where({ plan_key: params.key }).count("id as total").first<{ total: number } | undefined>();
  if (Number(clientesConEstePlan?.total ?? 0) > 0) {
    return NextResponse.json({ error: "Hay clientes con este plan asignado. Reasígnalos antes de eliminarlo." }, { status: 409 });
  }

  await db("plans").where({ key: params.key }).delete();

  const entrenador = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${entrenador.nombre} ${entrenador.apellido}`,
    targetType: "plan",
    targetId: 0,
    targetNombre: plan.name,
    accion: "eliminar",
    antes: plan,
  });

  return NextResponse.json({ message: "Plan eliminado correctamente." });
}
