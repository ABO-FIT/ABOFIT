import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { crearNotificacion } from "@/lib/notificaciones";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const orderId = Number(params.id);
  const pedido = await db("orders").where({ id: orderId }).first();
  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  const facturaExistente = await db("invoices").where({ order_id: orderId }).first();
  if (facturaExistente) {
    return NextResponse.json({ error: "Este pedido ya tiene una factura generada." }, { status: 400 });
  }

  let numero: string;
  try {
    numero = await db.transaction(async (trx) => {
      const [invoiceId] = await trx("invoices").insert({
        numero: "PENDIENTE",
        order_id: orderId,
        user_id: pedido.user_id,
        monto: pedido.total,
        estado: "pagada",
        fecha: new Date().toISOString().slice(0, 10),
      });

      const numeroGenerado = `FAC-${String(invoiceId).padStart(6, "0")}`;
      await trx("invoices").where({ id: invoiceId }).update({ numero: numeroGenerado });

      return numeroGenerado;
    });
  } catch (err) {
    const codigo = (err as { code?: string })?.code;
    if (codigo === "ER_DUP_ENTRY") {
      return NextResponse.json({ error: "Este pedido ya tiene una factura generada." }, { status: 409 });
    }
    throw err;
  }

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "pedido",
    targetId: orderId,
    accion: "confirmar_pago",
    despues: { factura: numero },
  });

  const comprador = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("users.id", pedido.user_id)
    .select("roles.nombre as rol")
    .first();
  const base = comprador?.rol === "Entrenador" ? "/entrenador" : "/portal";

  await crearNotificacion({
    userId: pedido.user_id,
    tipo: "factura",
    titulo: `Tu pago fue confirmado`,
    subtitulo: `Factura ${numero} generada para el pedido #${orderId}.`,
    link: `${base}/facturas`,
  });

  return NextResponse.json({ message: `Pago confirmado. Factura ${numero} generada.`, numero });
}
