import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const eliminado = await db("nutrition_logs").where({ id: Number(params.id), user_id: sesion.userId }).delete();

  if (!eliminado) {
    return NextResponse.json({ error: "Registro no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ message: "Registro eliminado." });
}
