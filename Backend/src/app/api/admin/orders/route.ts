import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");

  let query = db("orders")
    .join("users", "users.id", "orders.user_id")
    .select(
      "orders.id", "orders.total", "orders.estado", "orders.created_at", "orders.comprobante_path",
      "users.nombre", "users.apellido", "users.correo", "users.telefono"
    );

  if (estado) {
    query = query.andWhere("orders.estado", estado);
  }

  const pedidos = await query.orderBy("orders.created_at", "desc");

  const resultado = await Promise.all(
    pedidos.map(async (pedido) => {
      const [items, factura] = await Promise.all([
        db("order_items").where({ order_id: pedido.id }).select("name", "price", "qty"),
        db("invoices").where({ order_id: pedido.id }).select("id", "numero").first(),
      ]);
      return {
        id: pedido.id,
        total: pedido.total,
        estado: pedido.estado,
        fecha: pedido.created_at,
        comprobantePath: pedido.comprobante_path,
        facturaId: factura?.id ?? null,
        facturaNumero: factura?.numero ?? null,
        cliente: { nombre: pedido.nombre, apellido: pedido.apellido, correo: pedido.correo, telefono: pedido.telefono },
        items,
      };
    }),
  );

  return NextResponse.json({ pedidos: resultado });
}
