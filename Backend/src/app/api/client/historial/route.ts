import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get("tipo");
  const desde = searchParams.get("desde");
  const hasta = searchParams.get("hasta");

  if (tipo && tipo !== "rutina" && tipo !== "dieta") {
    return NextResponse.json({ error: "El tipo debe ser 'rutina' o 'dieta'." }, { status: 400 });
  }

  let query = db("historial_completados").where({ user_id: sesion.userId });
  if (tipo) query = query.andWhere({ tipo });
  if (desde) query = query.andWhere("fecha", ">=", desde);
  if (hasta) query = query.andWhere("fecha", "<=", hasta);

  const historial = await query.orderBy("fecha", "desc").select("id", "tipo", "fecha", "referencia", "etiqueta");

  return NextResponse.json({ historial });
}
