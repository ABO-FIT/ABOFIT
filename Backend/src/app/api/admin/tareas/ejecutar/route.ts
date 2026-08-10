import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { ejecutarTareasProgramadas } from "@/lib/scheduler";

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const resumen = await ejecutarTareasProgramadas({ forzar: true });

  return NextResponse.json({
    message: "Tareas ejecutadas correctamente.",
    ...resumen,
  });
}
