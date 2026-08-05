import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { crearNotificacion } from "@/lib/notificaciones";

const ETIQUETAS_ESTADO: Record<string, string> = {
  pendiente: "pendiente",
  recibido: "recibido",
  entregado: "entregado",
  cancelado: "cancelado",
};

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

  if (estado === "cancelado" && pedido.estado !== "cancelado") {
    const facturaExistente = await db("invoices").where({ order_id: orderId }).first();
    if (facturaExistente) {
      return NextResponse.json(
        { error: "No se puede cancelar un pedido que ya tiene una factura generada." },
        { status: 400 },
      );
    }
  }

  await db.transaction(async (trx) => {
    await trx("orders").where({ id: orderId }).update({ estado });

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
    despues: { estado },
  });

  const comprador = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("users.id", pedido.user_id)
    .select("roles.nombre as rol")
    .first();
  const base = comprador?.rol === "Entrenador" ? "/entrenador" : "/portal";

  await crearNotificacion({
    userId: pedido.user_id,
    tipo: "pedido",
    titulo: `Tu pedido #${orderId} está ${ETIQUETAS_ESTADO[estado] ?? estado}`,
    link: `${base}/pedidos`,
  });

  return NextResponse.json({ message: "Pedido actualizado correctamente." });
}
