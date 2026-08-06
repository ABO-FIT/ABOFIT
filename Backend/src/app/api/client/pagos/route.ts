import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const pagos = await db("payments")
    .where({ client_id: sesion.userId })
    .orderBy("fecha", "desc")
    .select("id", "monto", "concepto", "fecha", "estado", "comprobante_path");

  return NextResponse.json({ pagos });
}
