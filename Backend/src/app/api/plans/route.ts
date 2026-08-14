import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const planes = await db("plans")
    .where((builder) => {
      builder.whereNull("trainer_id").orWhere("trainer_id", sesion.userId);
    })
    .select("key", "name", "price", "includes_diet", "description", "periodicidad_key", "trainer_id");

  return NextResponse.json({ planes });
}
