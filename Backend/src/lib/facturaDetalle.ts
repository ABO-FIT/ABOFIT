import { db } from "@/lib/db";

export async function obtenerDetalleFactura(facturaId: number) {
  const factura = await db("invoices").where({ id: facturaId }).first();
  if (!factura) return null;

  const [cliente, items, plantilla, pedido] = await Promise.all([
    db("users")
      .join("roles", "roles.id", "users.rol_id")
      .where("users.id", factura.user_id)
      .select("users.nombre", "users.apellido", "users.correo", "users.telefono", "roles.nombre as rol")
      .first(),
    db("order_items")
      .leftJoin("products", "products.id", "order_items.product_id")
      .where("order_items.order_id", factura.order_id)
      .select("order_items.name", "order_items.price", "order_items.qty", "products.cat"),
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
