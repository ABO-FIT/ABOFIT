import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function PUT(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  await db("notifications").where({ user_id: sesion.userId, leido: false }).update({ leido: true });

  return NextResponse.json({ message: "Notificaciones marcadas como leídas." });
}
