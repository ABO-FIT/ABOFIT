import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { parsearJson } from "@/lib/json";
import { crearNotificacion } from "@/lib/notificaciones";

const ROLES_COMPRA = ["Cliente", "Entrenador"];

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || !ROLES_COMPRA.includes(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const pedidos = await db("orders").where({ user_id: sesion.userId }).orderBy("created_at", "desc");

  const resultado = await Promise.all(
    pedidos.map(async (pedido) => {
      const filas = await db("order_items")
        .leftJoin("products", "products.id", "order_items.product_id")
        .where("order_items.order_id", pedido.id)
        .select(
          "order_items.product_id",
          "order_items.name",
          "order_items.price",
          "order_items.qty",
          "products.cat",
          "products.goals"
        );

      const productIds = filas.map((f) => f.product_id).filter((id): id is number => id !== null);
      const imagenes = productIds.length > 0
        ? await db("product_images").whereIn("product_id", productIds).orderBy("position", "asc")
        : [];

      const items = filas.map((f) => ({
        productId: f.product_id as number | null,
        name: f.name,
        price: f.price,
        qty: f.qty,
        cat: f.cat ?? null,
        goals: f.goals ? parsearJson<string[]>(f.goals) : [],
        images: imagenes.filter((img) => img.product_id === f.product_id).map((img) => img.path),
      }));

      const factura = await db("invoices").where({ order_id: pedido.id }).select("id", "numero").first();

      return {
        id: pedido.id,
        total: pedido.total,
        estado: pedido.estado,
        fecha: pedido.created_at,
        comprobantePath: pedido.comprobante_path,
        facturaId: factura?.id ?? null,
        facturaNumero: factura?.numero ?? null,
        items,
      };
    }),
  );

  return NextResponse.json({ pedidos: resultado });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || !ROLES_COMPRA.includes(sesion.rol)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const items = await db("cart_items")
    .join("products", "products.id", "cart_items.product_id")
    .where("cart_items.user_id", sesion.userId)
    .select("products.id as product_id", "products.name", "products.price", "products.stock", "cart_items.qty");

  if (items.length === 0) {
    return NextResponse.json({ error: "Tu carrito está vacío." }, { status: 400 });
  }

  const sinStock = items.find((item) => item.qty > item.stock);
  if (sinStock) {
    return NextResponse.json(
      { error: `No hay suficiente existencia de "${sinStock.name}" (disponible: ${sinStock.stock}).` },
      { status: 400 },
    );
  }

  const total = items.reduce((suma, item) => suma + item.price * item.qty, 0);

  const orderId = await db.transaction(async (trx) => {
    const [id] = await trx("orders").insert({ user_id: sesion.userId, total, estado: "pendiente" });

    await trx("order_items").insert(
      items.map((item) => ({
        order_id: id,
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        qty: item.qty,
      })),
    );

    for (const item of items) {
      await trx("products").where({ id: item.product_id }).decrement("stock", item.qty);
    }

    await trx("cart_items").where({ user_id: sesion.userId }).delete();

    return id;
  });

  const comprador = await db("users").where({ id: sesion.userId }).first();
  const administradores = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("roles.nombre", "Administrador")
    .select("users.id");

  await Promise.all(
    administradores.map((admin) =>
      crearNotificacion({
        userId: admin.id,
        tipo: "pedido",
        titulo: `Nuevo pedido #${orderId}`,
        subtitulo: `${comprador.nombre} ${comprador.apellido} · RD$${total.toLocaleString("es-DO")}`,
        link: "/admin/pedidos",
      })
    )
  );

  return NextResponse.json({ id: orderId, message: "Pedido creado correctamente." }, { status: 201 });
}
