import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const eliminado = await db("routine_templates").where({ id: Number(params.id), trainer_id: sesion.userId }).delete();

  if (!eliminado) {
    return NextResponse.json({ error: "Plantilla no encontrada." }, { status: 404 });
  }

  return NextResponse.json({ message: "Plantilla eliminada." });
}
