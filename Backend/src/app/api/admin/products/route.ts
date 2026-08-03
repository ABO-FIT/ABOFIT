import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { parsearJson } from "@/lib/json";

const OBJETIVOS_VALIDOS = ["masa", "grasa", "mantenimiento", "rendimiento"];

function validarProducto(body: Record<string, unknown>) {
  const { cat, name, price, goals, stock } = body;

  if (typeof cat !== "string" || !cat.trim() || typeof name !== "string" || !name.trim()) {
    return "Categoría y nombre son obligatorios.";
  }
  if (typeof price !== "number" || price < 0) {
    return "El precio debe ser un número positivo.";
  }
  if (typeof stock !== "number" || stock < 0) {
    return "El stock debe ser un número positivo.";
  }
  if (!Array.isArray(goals) || goals.length === 0 || goals.some((g) => !OBJETIVOS_VALIDOS.includes(g))) {
    return "Debes indicar al menos un objetivo válido.";
  }
  return null;
}

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const productos = await db("products").select("id", "cat", "name", "price", "goals", "stock").orderBy("name", "asc");

  return NextResponse.json({
    productos: productos.map((p) => ({ ...p, goals: parsearJson<string[]>(p.goals) })),
  });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const errorValidacion = validarProducto(body);
  if (errorValidacion) {
    return NextResponse.json({ error: errorValidacion }, { status: 400 });
  }

  const { cat, name, price, goals, stock } = body as { cat: string; name: string; price: number; goals: string[]; stock: number };

  const [id] = await db("products").insert({
    cat: cat.trim(),
    name: name.trim(),
    price,
    stock,
    goals: JSON.stringify(goals),
  });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "producto",
    targetId: id,
    targetNombre: name,
    accion: "crear",
    despues: { cat, name, price, goals, stock },
  });

  return NextResponse.json({ id, message: "Producto creado correctamente." }, { status: 201 });
}
