import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const gimnasios = await db("gyms").select("id", "name", "city", "address", "phone").orderBy("name", "asc");

  return NextResponse.json({ gimnasios });
}
