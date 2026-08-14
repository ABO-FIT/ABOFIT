import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

const ROLES_VALIDOS = ["Administrador", "Entrenador", "Cliente"];

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const userId = Number(params.id);

  if (userId === sesion.userId) {
    return NextResponse.json({ error: "No puedes cambiar tu propio rol." }, { status: 400 });
  }

  const usuario = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("users.id", userId)
    .select("users.*", "roles.nombre as rol_actual")
    .first();

  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const rol = body && typeof body.rol === "string" ? body.rol : null;

  if (!rol || !ROLES_VALIDOS.includes(rol)) {
    return NextResponse.json({ error: "Rol inválido." }, { status: 400 });
  }

  const rolRow = await db("roles").where({ nombre: rol }).first();
  await db("users").where({ id: userId }).update({ rol_id: rolRow.id });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "usuario",
    targetId: userId,
    targetNombre: `${usuario.nombre} ${usuario.apellido}`,
    accion: "cambiar_rol",
    antes: { rol: usuario.rol_actual },
    despues: { rol },
  });

  return NextResponse.json({ message: "Rol actualizado correctamente." });
}
