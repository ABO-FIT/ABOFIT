import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function PUT(request: Request, { params }: { params: { key: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const anterior = await db("goals").where({ key: params.key }).first();
  if (!anterior) {
    return NextResponse.json({ error: "Objetivo no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const { label, shortLabel, color } = (body ?? {}) as Record<string, unknown>;

  if (typeof label !== "string" || !label.trim() || typeof shortLabel !== "string" || !shortLabel.trim() || typeof color !== "string" || !color.trim()) {
    return NextResponse.json({ error: "Nombre, nombre corto y color son obligatorios." }, { status: 400 });
  }

  const despues = { label: label.trim(), short_label: shortLabel.trim(), color: color.trim() };
  await db("goals").where({ key: params.key }).update(despues);

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "objetivo",
    targetId: 0,
    targetNombre: despues.label,
    accion: "editar",
    antes: anterior,
    despues,
  });

  return NextResponse.json({ message: "Objetivo actualizado correctamente." });
}

export async function DELETE(request: Request, { params }: { params: { key: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const key = params.key;
  const goal = await db("goals").where({ key }).first();
  if (!goal) {
    return NextResponse.json({ error: "Objetivo no encontrado." }, { status: 404 });
  }

  const usuariosConEsteObjetivo = await db("users").where({ goal_key: key }).count("id as total").first<{ total: number } | undefined>();
  if (Number(usuariosConEsteObjetivo?.total ?? 0) > 0) {
    return NextResponse.json({ error: "Hay clientes con este objetivo asignado. Reasígnalos antes de eliminarlo." }, { status: 409 });
  }

  const productos = await db("products").whereRaw("JSON_CONTAINS(goals, ?)", [JSON.stringify(key)]);
  if (productos.length > 0) {
    return NextResponse.json({ error: "Hay productos que usan este objetivo. Quítaselo antes de eliminarlo." }, { status: 409 });
  }

  await db("default_routines").where({ goal_key: key }).delete();
  await db("default_diets").where({ goal_key: key }).delete();
  await db("goals").where({ key }).delete();

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "objetivo",
    targetId: 0,
    targetNombre: goal.label,
    accion: "eliminar",
    antes: goal,
  });

  return NextResponse.json({ message: "Objetivo eliminado correctamente." });
}
