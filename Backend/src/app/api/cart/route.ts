import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

const ROLES_COMPRA = ["Cliente", "Entrenador"];

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || !ROLES_COMPRA.includes(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const items = await db("cart_items")
    .join("products", "products.id", "cart_items.product_id")
    .where("cart_items.user_id", sesion.userId)
    .select("products.id", "products.name", "products.cat", "products.price", "cart_items.qty");

  const total = items.reduce((suma, item) => suma + item.price * item.qty, 0);

  return NextResponse.json({ items, total });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || !ROLES_COMPRA.includes(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const productId = body && Number(body.productId);
  const qty = body && body.qty ? Number(body.qty) : 1;

  if (!productId || qty < 1) {
    return NextResponse.json({ error: "Producto y cantidad son obligatorios." }, { status: 400 });
  }

  const producto = await db("products").where({ id: productId }).first();
  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const existente = await db("cart_items").where({ user_id: sesion.userId, product_id: productId }).first();

  if (existente) {
    await db("cart_items").where({ id: existente.id }).update({ qty: existente.qty + qty });
  } else {
    await db("cart_items").insert({ user_id: sesion.userId, product_id: productId, qty });
  }

  return NextResponse.json({ message: "Producto agregado al carrito." }, { status: 201 });
}
