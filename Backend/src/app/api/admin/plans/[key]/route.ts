import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function PUT(request: Request, { params }: { params: { key: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const anterior = await db("plans").where({ key: params.key }).first();
  if (!anterior) {
    return NextResponse.json({ error: "Plan no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const { name, price, includesDiet, description } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim() || typeof price !== "number" || price < 0 || typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "Nombre, precio y descripción son obligatorios." }, { status: 400 });
  }

  const despues = { name: name.trim(), price, includes_diet: !!includesDiet, description: description.trim() };
  await db("plans").where({ key: params.key }).update(despues);

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "plan",
    targetId: 0,
    targetNombre: `Plan ${params.key}`,
    accion: "editar",
    antes: anterior,
    despues,
  });

  return NextResponse.json({ message: "Plan actualizado correctamente." });
}
