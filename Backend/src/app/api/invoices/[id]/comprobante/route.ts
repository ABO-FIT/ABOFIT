import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { eliminarImagen, guardarImagen } from "@/lib/upload";
import { crearNotificacion } from "@/lib/notificaciones";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const facturaId = Number(params.id);
  const factura = await db("invoices").where({ id: facturaId }).first();

  if (!factura || factura.user_id !== sesion.userId) {
    return NextResponse.json({ error: "Factura no encontrada." }, { status: 404 });
  }

  if (factura.estado === "pagada") {
    return NextResponse.json({ error: "Esta factura ya fue confirmada como pagada." }, { status: 400 });
  }

  const formData = await request.formData().catch(() => null);
  const archivo = formData?.get("comprobante");

  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json({ error: "Debes adjuntar una imagen del comprobante." }, { status: 400 });
  }

  let ruta: string;
  try {
    ruta = await guardarImagen(archivo, "comprobantes", `factura-${facturaId}`);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo procesar la imagen." }, { status: 400 });
  }

  if (factura.comprobante_path) {
    await eliminarImagen(factura.comprobante_path);
  }

  await db("invoices").where({ id: facturaId }).update({ comprobante_path: ruta });

  const cliente = await db("users").where({ id: sesion.userId }).first();
  const administradores = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("roles.nombre", "Administrador")
    .select("users.id");

  await Promise.all(
    administradores.map((admin) =>
      crearNotificacion({
        userId: admin.id,
        tipo: "factura",
        titulo: `Comprobante subido: Factura ${factura.numero}`,
        subtitulo: `${cliente.nombre} ${cliente.apellido} envió un comprobante de pago.`,
        link: "/admin/facturas",
      })
    )
  );

  return NextResponse.json({ message: "Comprobante enviado. Un administrador confirmará tu pago pronto." });
}
