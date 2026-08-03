import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { registrarAuditoria } from "@/lib/auditoria";
import { crearNotificacion } from "@/lib/notificaciones";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Administrador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const invoiceId = Number(params.id);
  const factura = await db("invoices").where({ id: invoiceId }).first();
  if (!factura) {
    return NextResponse.json({ error: "Factura no encontrada." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const estado = body && typeof body.estado === "string" ? body.estado : null;

  if (!estado || !["pendiente", "pagada"].includes(estado)) {
    return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
  }

  await db("invoices").where({ id: invoiceId }).update({ estado });

  const admin = await db("users").where({ id: sesion.userId }).first();
  await registrarAuditoria({
    adminId: sesion.userId,
    adminNombre: `${admin.nombre} ${admin.apellido}`,
    targetType: "factura",
    targetId: invoiceId,
    targetNombre: factura.numero,
    accion: "cambiar_estado",
    antes: { estado: factura.estado },
    despues: { estado },
  });

  if (estado === "pagada" && factura.estado !== "pagada") {
    const comprador = await db("users")
      .join("roles", "roles.id", "users.rol_id")
      .where("users.id", factura.user_id)
      .select("roles.nombre as rol")
      .first();
    const base = comprador?.rol === "Entrenador" ? "/entrenador" : "/portal";

    await crearNotificacion({
      userId: factura.user_id,
      tipo: "factura",
      titulo: `Factura ${factura.numero} marcada como pagada`,
      link: `${base}/facturas`,
    });
  }

  return NextResponse.json({ message: "Factura actualizada correctamente." });
}
