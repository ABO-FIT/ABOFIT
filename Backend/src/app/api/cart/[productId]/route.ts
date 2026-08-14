import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

const ROLES_COMPRA = ["Cliente", "Entrenador"];

export async function PUT(request: Request, { params }: { params: { productId: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || !ROLES_COMPRA.includes(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const qty = body ? Number(body.qty) : null;

  if (!qty || qty < 1) {
    return NextResponse.json({ error: "La cantidad debe ser al menos 1." }, { status: 400 });
  }

  await db("cart_items")
    .where({ user_id: sesion.userId, product_id: Number(params.productId) })
    .update({ qty });

  return NextResponse.json({ message: "Cantidad actualizada." });
}

export async function DELETE(request: Request, { params }: { params: { productId: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || !ROLES_COMPRA.includes(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  await db("cart_items")
    .where({ user_id: sesion.userId, product_id: Number(params.productId) })
    .delete();

  return NextResponse.json({ message: "Producto quitado del carrito." });
}
