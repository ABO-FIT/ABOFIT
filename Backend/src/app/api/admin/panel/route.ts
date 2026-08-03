import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const usuariosPorRol = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .select("roles.nombre as rol")
    .count("users.id as total")
    .groupBy("roles.nombre");

  const totalGimnasios = await db("gyms").count("id as total").first<{ total: number } | undefined>();
  const totalProductos = await db("products").count("id as total").first<{ total: number } | undefined>();
  const pedidosPendientes = await db("orders").where({ estado: "pendiente" }).count("id as total").first<{ total: number } | undefined>();
  const facturasPendientes = await db("invoices").where({ estado: "pendiente" }).count("id as total").first<{ total: number } | undefined>();

  return NextResponse.json({
    usuariosPorRol: usuariosPorRol.map((u) => ({ rol: u.rol, total: Number(u.total) })),
    totalGimnasios: Number(totalGimnasios?.total ?? 0),
    totalProductos: Number(totalProductos?.total ?? 0),
    pedidosPendientes: Number(pedidosPendientes?.total ?? 0),
    facturasPendientes: Number(facturasPendientes?.total ?? 0),
  });
}
