import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { parsearJson } from "@/lib/json";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  const { searchParams } = new URL(request.url);
  const goal = searchParams.get("goal");
  const cat = searchParams.get("cat");
  const buscar = searchParams.get("buscar")?.trim().toLowerCase();

  let query = db("products").select("id", "cat", "name", "price", "goals", "stock");

  if (cat) {
    query = query.where({ cat });
  }

  if (buscar) {
    query = query.whereRaw("LOWER(name) LIKE ?", [`%${buscar}%`]);
  }

  const productos = await query.orderBy("name", "asc");

  let goalUsuario: string | null = goal;
  if (!goalUsuario && sesion?.rol === "Cliente") {
    const usuario = await db("users").where({ id: sesion.userId }).first();
    goalUsuario = usuario?.goal_key ?? null;
  }

  const resultado = productos.map((producto) => {
    const goals = parsearJson<string[]>(producto.goals);
    return {
      id: producto.id,
      cat: producto.cat,
      name: producto.name,
      price: producto.price,
      stock: producto.stock,
      goals,
      recomendado: goalUsuario ? goals.includes(goalUsuario) : false,
    };
  });

  resultado.sort((a, b) => Number(b.recomendado) - Number(a.recomendado));

  const categorias = [...new Set((await db("products").select("cat")).map((p) => p.cat))];

  return NextResponse.json({ productos: resultado, categorias });
}
