import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { obtenerClienteDelEntrenador } from "@/lib/trainerClient";

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

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  if (tipo && tipo !== "rutina" && tipo !== "dieta") {
    return NextResponse.json({ error: "El tipo debe ser 'rutina' o 'dieta'." }, { status: 400 });
  }

  let query = db("historial_completados").where({ user_id: clientId });
  if (tipo) query = query.andWhere({ tipo });
  if (desde) query = query.andWhere("fecha", ">=", desde);
  if (hasta) query = query.andWhere("fecha", "<=", hasta);

  const historial = await query.orderBy("fecha", "desc").select("id", "tipo", "fecha", "referencia", "etiqueta");

  return NextResponse.json({ historial });
}
