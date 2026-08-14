import { NextResponse } from "next/server";
import { obtenerSesion } from "@/lib/auth";
import { obtenerDetalleFactura } from "@/lib/facturaDetalle";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const detalle = await obtenerDetalleFactura(Number(params.id));
  if (!detalle) {
    return NextResponse.json({ error: "Factura no encontrada." }, { status: 404 });
  }

  return NextResponse.json(detalle);
}
