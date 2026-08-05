import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");

  let query = db("invoices")
    .join("users", "users.id", "invoices.user_id")
    .select(
      "invoices.id", "invoices.numero", "invoices.order_id", "invoices.monto", "invoices.estado", "invoices.fecha", "invoices.comprobante_path",
      "users.nombre", "users.apellido", "users.correo",
    );

  if (estado) {
    query = query.andWhere("invoices.estado", estado);
  }

  const facturas = await query.orderBy("invoices.fecha", "desc");

  return NextResponse.json({
    facturas: facturas.map((f) => ({
      id: f.id,
      numero: f.numero,
      orderId: f.order_id,
      monto: f.monto,
      estado: f.estado,
      fecha: f.fecha,
      comprobantePath: f.comprobante_path,
      cliente: { nombre: f.nombre, apellido: f.apellido, correo: f.correo },
    })),
  });
}
