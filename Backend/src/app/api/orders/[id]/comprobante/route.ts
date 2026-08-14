import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { eliminarImagen, guardarImagen } from "@/lib/upload";
import { crearNotificacion } from "@/lib/notificaciones";

const ROLES_COMPRA = ["Cliente", "Entrenador"];

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || !ROLES_COMPRA.includes(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const orderId = Number(params.id);
  const pedido = await db("orders").where({ id: orderId }).first();

  if (!pedido || pedido.user_id !== sesion.userId) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  if (pedido.estado === "cancelado") {
    return NextResponse.json({ error: "Este pedido fue cancelado." }, { status: 400 });
  }

  const facturaExistente = await db("invoices").where({ order_id: orderId }).first();
  if (facturaExistente) {
    return NextResponse.json({ error: "Este pedido ya fue confirmado como pagado." }, { status: 400 });
  }

  const formData = await request.formData().catch(() => null);
  const archivo = formData?.get("comprobante");

  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json({ error: "Debes adjuntar una imagen del comprobante." }, { status: 400 });
  }

  let ruta: string;
  try {
    ruta = await guardarImagen(archivo, "comprobantes", `pedido-${orderId}`);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo procesar la imagen." }, { status: 400 });
  }

  if (pedido.comprobante_path) {
    await eliminarImagen(pedido.comprobante_path);
  }

  await db("orders").where({ id: orderId }).update({ comprobante_path: ruta });

  const cliente = await db("users").where({ id: sesion.userId }).first();
  const administradores = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("roles.nombre", "Administrador")
    .select("users.id");

  await Promise.all(
    administradores.map((admin) =>
      crearNotificacion({
        userId: admin.id,
        tipo: "pedido",
        titulo: `Comprobante subido: Pedido #${orderId}`,
        subtitulo: `${cliente.nombre} ${cliente.apellido} envió un comprobante de pago.`,
        link: "/admin/pedidos",
      })
    )
  );

  return NextResponse.json({ message: "Comprobante enviado. Un administrador confirmará tu pago pronto." });
}
