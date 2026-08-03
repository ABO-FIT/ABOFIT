import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { parsearJson } from "@/lib/json";
import { eliminarImagen, guardarImagen } from "@/lib/upload";
import { leerCamposFormulario } from "@/lib/productos";

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

  let imagePath: string | null = anterior.image_path;
  const foto = formData.get("imagen");
  if (foto instanceof File && foto.size > 0) {
    try {
      imagePath = await guardarImagen(foto, "products", "producto");
      await eliminarImagen(anterior.image_path);
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo guardar la imagen." }, { status: 400 });
    }
  }

  await db("products").where({ id: productId }).update({
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

  await db("cart_items").where({ product_id: productId }).delete();
  await db("products").where({ id: productId }).delete();
  await eliminarImagen(producto.image_path);

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
