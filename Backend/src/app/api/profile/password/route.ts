import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

const PASSWORD_MIN_LENGTH = 8;

export async function PUT(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { passwordActual, passwordNueva } = body as Record<string, unknown>;

  if (typeof passwordActual !== "string" || !passwordActual || typeof passwordNueva !== "string") {
    return NextResponse.json({ error: "La contraseña actual y la nueva son obligatorias." }, { status: 400 });
  }

  if (passwordNueva.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      { error: `La nueva contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  const usuario = await db("users").where({ id: sesion.userId }).first();
  if (!usuario || !usuario.password_hash) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  const passwordValida = await bcrypt.compare(passwordActual, usuario.password_hash);
  if (!passwordValida) {
    return NextResponse.json({ error: "La contraseña actual no es correcta." }, { status: 401 });
  }

  const nuevoHash = await bcrypt.hash(passwordNueva, 10);
  await db("users").where({ id: sesion.userId }).update({ password_hash: nuevoHash });

  return NextResponse.json({ message: "Contraseña actualizada correctamente." });
}
