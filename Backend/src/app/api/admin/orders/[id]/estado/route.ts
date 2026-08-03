import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";

const ESTADOS_VALIDOS = ["pendiente", "recibido", "entregado", "cancelado"];

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const orderId = Number(params.id);
  const pedido = await db("orders").where({ id: orderId }).first();
  if (!pedido) {
    return NextResponse.json({ error: "Pedido no encontrado." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const estado = body && typeof body.estado === "string" ? body.estado : null;

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  let facturaGenerada: { id: number; numero: string } | null = null;

  await db.transaction(async (trx) => {
    await trx("orders").where({ id: orderId }).update({ estado });

    if (estado === "recibido" && pedido.estado !== "recibido") {
      const facturaExistente = await trx("invoices").where({ order_id: orderId }).first();

      if (!facturaExistente) {
        const [invoiceId] = await trx("invoices").insert({
          numero: "PENDIENTE",
          order_id: orderId,
          user_id: pedido.user_id,
          monto: pedido.total,
          estado: "pendiente",
          fecha: new Date().toISOString().slice(0, 10),
        });

        const numero = `FAC-${String(invoiceId).padStart(6, "0")}`;
        await trx("invoices").where({ id: invoiceId }).update({ numero });

        facturaGenerada = { id: invoiceId, numero };
      }
    }

    if (estado === "cancelado" && pedido.estado !== "cancelado") {
      const items = await trx("order_items").where({ order_id: orderId }).select("product_id", "qty");
      for (const item of items) {
        if (item.product_id) {
          await trx("products").where({ id: item.product_id }).increment("stock", item.qty);
        }
      }
    }
  });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "pedido",
    targetId: orderId,
    accion: "cambiar_estado",
    antes: { estado: pedido.estado },
    despues: { estado, factura: facturaGenerada },
  });

  const numeroFactura: string | null = facturaGenerada ? (facturaGenerada as { id: number; numero: string }).numero : null;

  return NextResponse.json({
    message: numeroFactura
      ? `Pedido actualizado y factura ${numeroFactura} generada.`
      : "Pedido actualizado correctamente.",
  });
}
