import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const PASSWORD_MIN_LENGTH = 8;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { token, password } = body as Record<string, unknown>;

  if (typeof token !== "string" || !token.trim() || typeof password !== "string") {
    return NextResponse.json({ error: "Token y contraseña son obligatorios." }, { status: 400 });
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    return NextResponse.json(
      { error: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.` },
      { status: 400 },
    );
  }

  const registro = await db("password_set_tokens").where({ token }).first();

  if (!registro) {
    return NextResponse.json({ error: "El enlace no es válido." }, { status: 400 });
  }

  if (registro.used_at) {
    return NextResponse.json({ error: "El enlace ya fue utilizado." }, { status: 400 });
  }

  if (new Date(registro.expires_at) < new Date()) {
    return NextResponse.json({ error: "El enlace ha expirado." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await db.transaction(async (trx) => {
    await trx("users").where({ id: registro.user_id }).update({ password_hash: passwordHash });
    await trx("password_set_tokens").where({ id: registro.id }).update({ used_at: new Date() });
  });

  return NextResponse.json({ message: "Contraseña definida correctamente." }, { status: 200 });
}
