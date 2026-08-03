import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  await db("notifications").where({ id: Number(params.id), user_id: sesion.userId }).update({ leido: true });

  return NextResponse.json({ message: "Notificación marcada como leída." });
}
