import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { parsearJson } from "@/lib/json";
import { guardarImagen } from "@/lib/upload";
import { leerCamposFormulario } from "@/lib/productos";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const productos = await db("products")
    .select("id", "cat", "name", "price", "goals", "stock", "image_path", "beneficios", "indicaciones", "ingredientes", "descripcion", "aviso_seguridad")
    .orderBy("name", "asc");

  return NextResponse.json({
    productos: productos.map((p) => ({ ...p, goals: parsearJson<string[]>(p.goals) })),
  });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const datos = leerCamposFormulario(formData);
  if (typeof datos === "string") {
    return NextResponse.json({ error: datos }, { status: 400 });
  }

  let imagePath: string | null = null;
  const foto = formData.get("imagen");
  if (foto instanceof File && foto.size > 0) {
    try {
      imagePath = await guardarImagen(foto, "products", "producto");
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo guardar la imagen." }, { status: 400 });
    }
  }

  const [id] = await db("products").insert({
    cat: datos.cat,
    name: datos.name,
    price: datos.price,
    stock: datos.stock,
    goals: JSON.stringify(datos.goals),
    image_path: imagePath,
    beneficios: datos.beneficios,
    indicaciones: datos.indicaciones,
    ingredientes: datos.ingredientes,
    descripcion: datos.descripcion,
    aviso_seguridad: datos.avisoSeguridad,
  });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "producto",
    targetId: id,
    targetNombre: datos.name,
    accion: "crear",
    despues: datos,
  });

  return NextResponse.json({ id, message: "Producto creado correctamente." }, { status: 201 });
}
