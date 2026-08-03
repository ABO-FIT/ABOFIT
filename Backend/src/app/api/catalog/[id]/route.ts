import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parsearJson } from "@/lib/json";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const producto = await db("products").where({ id: Number(params.id) }).first();

  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    producto: {
      id: producto.id,
      cat: producto.cat,
      name: producto.name,
      price: producto.price,
      stock: producto.stock,
      imagePath: producto.image_path,
      goals: parsearJson<string[]>(producto.goals),
      beneficios: producto.beneficios,
      indicaciones: producto.indicaciones,
      ingredientes: producto.ingredientes,
      descripcion: producto.descripcion,
      avisoSeguridad: producto.aviso_seguridad,
    },
  });
}
