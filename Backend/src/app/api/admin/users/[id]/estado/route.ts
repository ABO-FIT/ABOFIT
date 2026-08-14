import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const userId = Number(params.id);

  if (userId === sesion.userId) {
    return NextResponse.json({ error: "No puedes desactivar tu propia cuenta." }, { status: 400 });
  }

  const usuario = await db("users").where({ id: userId }).first();
  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const activo = body ? Boolean(body.activo) : null;

  if (activo === null) {
    return NextResponse.json({ error: "El campo activo es obligatorio." }, { status: 400 });
  }

  await db("users").where({ id: userId }).update({ activo });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "usuario",
    targetId: userId,
    targetNombre: `${usuario.nombre} ${usuario.apellido}`,
    accion: activo ? "activar" : "desactivar",
    antes: { activo: !!usuario.activo },
    despues: { activo },
  });

  return NextResponse.json({ message: activo ? "Usuario activado." : "Usuario desactivado." });
}
