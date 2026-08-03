import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const gymId = Number(params.id);
  const anterior = await db("gyms").where({ id: gymId }).first();
  if (!anterior) {
    return NextResponse.json({ error: "Gimnasio no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const { name, city, address, phone } = (body ?? {}) as Record<string, unknown>;

  if (typeof name !== "string" || !name.trim() || typeof city !== "string" || !city.trim()) {
    return NextResponse.json({ error: "Nombre y ciudad son obligatorios." }, { status: 400 });
  }

  const despues = {
    name: name.trim(),
    city: city.trim(),
    address: typeof address === "string" ? address.trim() : null,
    phone: typeof phone === "string" ? phone.trim() : null,
  };

  await db("gyms").where({ id: gymId }).update(despues);

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "gimnasio",
    targetId: gymId,
    targetNombre: despues.name,
    accion: "editar",
    antes: anterior,
    despues,
  });

  return NextResponse.json({ message: "Gimnasio actualizado correctamente." });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const gymId = Number(params.id);
  const gimnasio = await db("gyms").where({ id: gymId }).first();
  if (!gimnasio) {
    return NextResponse.json({ error: "Gimnasio no encontrado." }, { status: 404 });
  }

  await db("users").where({ gym_id: gymId }).update({ gym_id: null });
  await db("gyms").where({ id: gymId }).delete();

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "gimnasio",
    targetId: gymId,
    targetNombre: gimnasio.name,
    accion: "eliminar",
    antes: gimnasio,
  });

  return NextResponse.json({ message: "Gimnasio eliminado correctamente." });
}
