import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";
import { obtenerAdherenciaSemanaDieta } from "@/lib/dietaEstado";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientId = Number(params.id);
  const cliente = await obtenerClienteDelEntrenador(sesion.userId, clientId);
  if (!cliente) {
    return NextResponse.json({ error: "Cliente no encontrado." }, { status: 404 });
  }

  const [diario, adherenciaPlan] = await Promise.all([
    db("nutrition_logs").where({ user_id: clientId }).orderBy("fecha", "desc").orderBy("id", "desc").limit(30).select("id", "fecha", "tipo", "descripcion"),
    obtenerAdherenciaSemanaDieta(clientId),
  ]);

  return NextResponse.json({ diario, adherenciaPlan });
}
