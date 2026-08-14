import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const usuario = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("users.id", Number(params.id))
    .select(
      "users.id", "users.nombre", "users.apellido", "users.correo", "users.usuario",
      "users.telefono", "users.activo", "roles.nombre as rol",
    )
    .first();

  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ usuario });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const userId = Number(params.id);
  const anterior = await db("users").where({ id: userId }).first();
  if (!anterior) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { nombre, apellido, correo, telefono } = body as Record<string, unknown>;

  if (
    typeof nombre !== "string" || !nombre.trim() ||
    typeof apellido !== "string" || !apellido.trim() ||
    typeof correo !== "string" || !correo.trim() ||
    typeof telefono !== "string" || !telefono.trim()
  ) {
    return NextResponse.json({ error: "Nombre, apellido, correo y teléfono son obligatorios." }, { status: 400 });
  }

  if (!esCorreoValido(correo)) {
    return NextResponse.json({ error: "El correo electrónico no tiene un formato válido." }, { status: 400 });
  }

  const correoNormalizado = correo.trim().toLowerCase();

  const enUso = await db("users").where({ correo: correoNormalizado }).whereNot({ id: userId }).first();
  if (enUso) {
    return NextResponse.json({ error: "El correo ya está en uso por otro usuario." }, { status: 409 });
  }

  await db("users").where({ id: userId }).update({
    nombre: nombre.trim(),
    apellido: apellido.trim(),
    correo: correoNormalizado,
    telefono: telefono.trim(),
  });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "usuario",
    targetId: userId,
    targetNombre: `${nombre} ${apellido}`,
    accion: "editar",
    antes: { nombre: anterior.nombre, apellido: anterior.apellido, correo: anterior.correo, telefono: anterior.telefono },
    despues: { nombre, apellido, correo: correoNormalizado, telefono },
  });

  return NextResponse.json({ message: "Usuario actualizado correctamente." });
}
