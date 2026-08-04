import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const categoryId = Number(params.id);
  const anterior = await db("categories").where({ id: categoryId }).first();
  if (!anterior) {
    return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const name = body && typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  await db("categories").where({ id: categoryId }).update({ name });
  await db("products").where({ cat: anterior.name }).update({ cat: name });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "categoria",
    targetId: categoryId,
    targetNombre: name,
    accion: "editar",
    antes: { name: anterior.name },
    despues: { name },
  });

  return NextResponse.json({ message: "Categoría actualizada correctamente." });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const categoryId = Number(params.id);
  const categoria = await db("categories").where({ id: categoryId }).first();
  if (!categoria) {
    return NextResponse.json({ error: "Categoría no encontrada." }, { status: 404 });
  }

  const enUso = await db("products").where({ cat: categoria.name }).count("id as total").first<{ total: number } | undefined>();
  if (Number(enUso?.total ?? 0) > 0) {
    return NextResponse.json({ error: "Hay productos usando esta categoría. Reasígnalos antes de eliminarla." }, { status: 409 });
  }

  await db("categories").where({ id: categoryId }).delete();

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "categoria",
    targetId: categoryId,
    targetNombre: categoria.name,
    accion: "eliminar",
  });

  return NextResponse.json({ message: "Categoría eliminada correctamente." });
}
