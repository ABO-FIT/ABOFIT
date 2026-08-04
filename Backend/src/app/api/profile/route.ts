import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const usuario = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("users.id", sesion.userId)
    .select(
      "users.id",
      "users.nombre",
      "users.apellido",
      "users.correo",
      "users.usuario",
      "users.telefono",
      "users.especialidad",
      "users.bio",
      "users.bank_name",
      "users.bank_account",
      "users.bank_holder",
      "users.pay_phone",
      "users.gym_id",
      "users.fecha_inicio",
      "roles.nombre as rol",
    )
    .first();

  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ usuario });
}

export async function PUT(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { nombre, apellido, correo, telefono, especialidad, bio, bankName, bankAccount, bankHolder, payPhone, gymId } =
    body as Record<string, unknown>;

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

  const correoEnUso = await db("users")
    .where({ correo: correoNormalizado })
    .whereNot({ id: sesion.userId })
    .first();

  if (correoEnUso) {
    return NextResponse.json({ error: "El correo ya está en uso por otro usuario." }, { status: 409 });
  }

  await db("users")
    .where({ id: sesion.userId })
    .update({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      correo: correoNormalizado,
      telefono: telefono.trim(),
      especialidad: sesion.rol === "Entrenador" && typeof especialidad === "string" ? especialidad.trim() : null,
      bio: sesion.rol === "Entrenador" && typeof bio === "string" ? bio.trim() : null,
      bank_name: sesion.rol === "Entrenador" && typeof bankName === "string" ? bankName.trim() : null,
      bank_account: sesion.rol === "Entrenador" && typeof bankAccount === "string" ? bankAccount.trim() : null,
      bank_holder: sesion.rol === "Entrenador" && typeof bankHolder === "string" ? bankHolder.trim() : null,
      pay_phone: sesion.rol === "Entrenador" && typeof payPhone === "string" ? payPhone.trim() : null,
      gym_id: sesion.rol === "Entrenador" && typeof gymId === "number" ? gymId : null,
    });

  return NextResponse.json({ message: "Perfil actualizado correctamente." });
}
