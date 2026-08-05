import { db } from "@/lib/db";

export async function obtenerDetalleFactura(facturaId: number) {
  const factura = await db("invoices").where({ id: facturaId }).first();
  if (!factura) return null;

  const [cliente, items, plantilla, pedido] = await Promise.all([
    db("users").where({ id: factura.user_id }).select("nombre", "apellido", "correo", "telefono").first(),
    db("order_items").where({ order_id: factura.order_id }).select("name", "price", "qty"),
    db("invoice_template").first(),
    db("orders").where({ id: factura.order_id }).select("estado").first(),
  ]);

  return {
    factura: {
      id: factura.id,
      numero: factura.numero,
      monto: factura.monto,
      estado: factura.estado,
      fecha: factura.fecha,
      orderId: factura.order_id,
      userId: factura.user_id,
      comprobantePath: factura.comprobante_path,
    },
    cliente,
    items,
    pedidoEstado: pedido?.estado ?? null,
    plantilla: plantilla
      ? {
          companyName: plantilla.company_name,
          tagline: plantilla.tagline,
          email: plantilla.email,
          phone: plantilla.phone,
          address: plantilla.address,
          bankName: plantilla.bank_name,
          bankAccount: plantilla.bank_account,
          bankHolder: plantilla.bank_holder,
          taxId: plantilla.tax_id,
        }
      : null,
  };
}
