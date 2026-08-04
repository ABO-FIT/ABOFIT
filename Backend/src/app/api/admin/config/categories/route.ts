import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const categorias = await db("categories").select("id", "name").orderBy("name", "asc");
  return NextResponse.json({ categorias });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const name = body && typeof body.name === "string" ? body.name.trim() : "";

  if (!name) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  const existente = await db("categories").where({ name }).first();
  if (existente) {
    return NextResponse.json({ error: "Esa categoría ya existe." }, { status: 409 });
  }

  const [id] = await db("categories").insert({ name });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "categoria",
    targetId: id,
    targetNombre: name,
    accion: "crear",
  });

  return NextResponse.json({ id, message: "Categoría creada correctamente." }, { status: 201 });
}
