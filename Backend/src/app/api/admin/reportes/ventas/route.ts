import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const totalHistorico = await db("orders")
    .whereNot({ estado: "cancelado" })
    .sum("total as total")
    .first<{ total: number | null } | undefined>();

  const totalUltimos30 = await db("orders")
    .whereNot({ estado: "cancelado" })
    .andWhere("created_at", ">=", hace30Dias)
    .sum("total as total")
    .first<{ total: number | null } | undefined>();

  const pedidosPorEstado = await db("orders").select("estado").count("id as total").groupBy("estado");

  const topProductos = await db("order_items")
    .join("orders", "orders.id", "order_items.order_id")
    .whereNot("orders.estado", "cancelado")
    .select("order_items.name")
    .sum("order_items.qty as cantidad")
    .groupBy("order_items.name")
    .orderBy("cantidad", "desc")
    .limit(5);

  return NextResponse.json({
    totalHistorico: Number(totalHistorico?.total ?? 0),
    totalUltimos30Dias: Number(totalUltimos30?.total ?? 0),
    pedidosPorEstado: pedidosPorEstado.map((p) => ({ estado: p.estado, total: Number(p.total) })),
    topProductos: topProductos.map((p) => ({ name: p.name, cantidad: Number(p.cantidad) })),
  });
}
