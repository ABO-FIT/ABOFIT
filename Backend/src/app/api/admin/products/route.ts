import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { parsearJson } from "@/lib/json";
import { esImagenValida, guardarImagen } from "@/lib/upload";
import { leerCamposFormulario } from "@/lib/productos";

const MAX_IMAGENES = 3;

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const productos = await db("products")
    .select("id", "cat", "name", "price", "goals", "stock", "beneficios", "indicaciones", "ingredientes", "descripcion", "aviso_seguridad")
    .orderBy("name", "asc");

  const imagenes = await db("product_images").orderBy("position", "asc");

  return NextResponse.json({
    productos: productos.map((p) => ({
      ...p,
      goals: parsearJson<string[]>(p.goals),
      images: imagenes.filter((img) => img.product_id === p.id).map((img) => ({ id: img.id, path: img.path })),
    })),
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

  const archivos = formData.getAll("imagenes").filter((f): f is File => f instanceof File && f.size > 0);

  if (archivos.length > MAX_IMAGENES) {
    return NextResponse.json({ error: `Puedes subir un máximo de ${MAX_IMAGENES} imágenes.` }, { status: 400 });
  }

  for (const archivo of archivos) {
    if (!esImagenValida(archivo.type)) {
      return NextResponse.json({ error: "Solo se permiten imágenes JPG, PNG o WEBP." }, { status: 400 });
    }
  }

  const [id] = await db("products").insert({
    cat: datos.cat,
    name: datos.name,
    price: datos.price,
    stock: datos.stock,
    goals: JSON.stringify(datos.goals),
    beneficios: datos.beneficios,
    indicaciones: datos.indicaciones,
    ingredientes: datos.ingredientes,
    descripcion: datos.descripcion,
    aviso_seguridad: datos.avisoSeguridad,
  });

  let posicion = 0;
  for (const archivo of archivos) {
    const rutaImagen = await guardarImagen(archivo, "products", "producto");
    await db("product_images").insert({ product_id: id, path: rutaImagen, position: posicion });
    posicion += 1;
  }

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
