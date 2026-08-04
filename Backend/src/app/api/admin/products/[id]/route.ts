import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { parsearJson } from "@/lib/json";
import { eliminarImagen, esImagenValida, guardarImagen } from "@/lib/upload";
import { leerCamposFormulario } from "@/lib/productos";

const MAX_IMAGENES = 3;

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const productId = Number(params.id);
  const anterior = await db("products").where({ id: productId }).first();
  if (!anterior) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const datos = leerCamposFormulario(formData);
  if (typeof datos === "string") {
    return NextResponse.json({ error: datos }, { status: 400 });
  }

  const eliminarIdsRaw = formData.get("eliminarImagenIds");
  let eliminarIds: number[] = [];
  if (typeof eliminarIdsRaw === "string" && eliminarIdsRaw.trim()) {
    try {
      eliminarIds = JSON.parse(eliminarIdsRaw);
    } catch {
      return NextResponse.json({ error: "Lista de imágenes a eliminar inválida." }, { status: 400 });
    }
  }

  const nuevosArchivos = formData.getAll("imagenes").filter((f): f is File => f instanceof File && f.size > 0);

  for (const archivo of nuevosArchivos) {
    if (!esImagenValida(archivo.type)) {
      return NextResponse.json({ error: "Solo se permiten imágenes JPG, PNG o WEBP." }, { status: 400 });
    }
  }

  const imagenesActuales = await db("product_images").where({ product_id: productId }).orderBy("position", "asc");
  const imagenesRestantes = imagenesActuales.filter((img) => !eliminarIds.includes(img.id));

  if (imagenesRestantes.length + nuevosArchivos.length > MAX_IMAGENES) {
    return NextResponse.json({ error: `Puedes tener un máximo de ${MAX_IMAGENES} imágenes por producto.` }, { status: 400 });
  }

  await db("products").where({ id: productId }).update({
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

  const imagenesAEliminar = imagenesActuales.filter((img) => eliminarIds.includes(img.id));
  for (const img of imagenesAEliminar) {
    await eliminarImagen(img.path);
    await db("product_images").where({ id: img.id }).delete();
  }

  let posicion = imagenesRestantes.length > 0 ? Math.max(...imagenesRestantes.map((i) => i.position)) + 1 : 0;
  for (const archivo of nuevosArchivos) {
    const rutaImagen = await guardarImagen(archivo, "products", "producto");
    await db("product_images").insert({ product_id: productId, path: rutaImagen, position: posicion });
    posicion += 1;
  }

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "producto",
    targetId: productId,
    targetNombre: datos.name,
    accion: "editar",
    antes: { ...anterior, goals: parsearJson(anterior.goals) },
    despues: datos,
  });

  return NextResponse.json({ message: "Producto actualizado correctamente." });
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const productId = Number(params.id);
  const producto = await db("products").where({ id: productId }).first();
  if (!producto) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  const imagenes = await db("product_images").where({ product_id: productId });
  for (const img of imagenes) {
    await eliminarImagen(img.path);
  }

  await db("cart_items").where({ product_id: productId }).delete();
  await db("product_images").where({ product_id: productId }).delete();
  await db("products").where({ id: productId }).delete();

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "producto",
    targetId: productId,
    targetNombre: producto.name,
    accion: "eliminar",
    antes: { ...producto, goals: parsearJson(producto.goals) },
  });

  return NextResponse.json({ message: "Producto eliminado correctamente." });
}
