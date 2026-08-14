import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const registros = await db("audit_log")
    .orderBy("created_at", "desc")
    .limit(200)
    .select("id", "admin_nombre", "target_type", "target_id", "target_nombre", "accion", "antes", "despues", "created_at");

  return NextResponse.json({ registros });
}
