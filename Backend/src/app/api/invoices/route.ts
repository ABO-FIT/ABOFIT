import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const facturas = await db("invoices")
    .where({ user_id: sesion.userId })
    .orderBy("fecha", "desc")
    .select("id", "numero", "order_id", "monto", "estado", "fecha");

  return NextResponse.json({ facturas });
}
