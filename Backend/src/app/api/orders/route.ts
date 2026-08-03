import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

const ROLES_COMPRA = ["Cliente", "Entrenador"];

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || !ROLES_COMPRA.includes(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const pedidos = await db("orders").where({ user_id: sesion.userId }).orderBy("created_at", "desc");

  const resultado = await Promise.all(
    pedidos.map(async (pedido) => {
      const items = await db("order_items").where({ order_id: pedido.id }).select("name", "price", "qty");
      return {
        id: pedido.id,
        total: pedido.total,
        estado: pedido.estado,
        fecha: pedido.created_at,
        items,
      };
    }),
  );

  return NextResponse.json({ pedidos: resultado });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || !ROLES_COMPRA.includes(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const items = await db("cart_items")
    .join("products", "products.id", "cart_items.product_id")
    .where("cart_items.user_id", sesion.userId)
    .select("products.id as product_id", "products.name", "products.price", "cart_items.qty");

  if (items.length === 0) {
    return NextResponse.json({ error: "Tu carrito está vacío." }, { status: 400 });
  }

  const total = items.reduce((suma, item) => suma + item.price * item.qty, 0);

  const orderId = await db.transaction(async (trx) => {
    const [id] = await trx("orders").insert({ user_id: sesion.userId, total, estado: "pendiente" });

    await trx("order_items").insert(
      items.map((item) => ({
        order_id: id,
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        qty: item.qty,
      })),
    );

    await trx("cart_items").where({ user_id: sesion.userId }).delete();

    return id;
  });

  return NextResponse.json({ id: orderId, message: "Pedido creado correctamente." }, { status: 201 });
}
