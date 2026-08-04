import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { generarRecordatoriosCliente } from "@/lib/recordatorios";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (sesion.rol === "Cliente") {
    await generarRecordatoriosCliente(sesion.userId);
  }

  const notificaciones = await db("notifications")
    .where({ user_id: sesion.userId })
    .orderBy("created_at", "desc")
    .limit(30)
    .select("id", "tipo", "titulo", "subtitulo", "link", "leido", "created_at");

  const noLeidas = await db("notifications")
    .where({ user_id: sesion.userId, leido: false })
    .count("id as total")
    .first<{ total: number } | undefined>();

  return NextResponse.json({ notificaciones, noLeidas: Number(noLeidas?.total ?? 0) });
}
