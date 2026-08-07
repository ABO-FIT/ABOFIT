import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { calcularAlertasEntrenador } from "@/lib/alertas";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const alertas = await calcularAlertasEntrenador(sesion.userId);

  return NextResponse.json({ alertas });
}
