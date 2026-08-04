import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { obtenerDetalleFactura } from "@/lib/facturaDetalle";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const factura = await db("invoices").where({ id: Number(params.id) }).first();
  if (!factura || factura.user_id !== sesion.userId) {
    return NextResponse.json({ error: "Factura no encontrada." }, { status: 404 });
  }

  const detalle = await obtenerDetalleFactura(Number(params.id));
  return NextResponse.json(detalle);
}
