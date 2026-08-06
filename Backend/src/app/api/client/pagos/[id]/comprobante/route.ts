import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { eliminarImagen, guardarImagen } from "@/lib/upload";
import { crearNotificacion } from "@/lib/notificaciones";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const pagoId = Number(params.id);
  const pago = await db("payments").where({ id: pagoId }).first();

  if (!pago || pago.client_id !== sesion.userId) {
    return NextResponse.json({ error: "Pago no encontrado." }, { status: 404 });
  }

  if (pago.estado === "pagado") {
    return NextResponse.json({ error: "Este pago ya fue confirmado." }, { status: 400 });
  }

  const formData = await request.formData().catch(() => null);
  const archivo = formData?.get("comprobante");

  if (!(archivo instanceof File) || archivo.size === 0) {
    return NextResponse.json({ error: "Debes adjuntar una imagen del comprobante." }, { status: 400 });
  }

  let ruta: string;
  try {
    ruta = await guardarImagen(archivo, "comprobantes", `pago-${pagoId}`);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "No se pudo procesar la imagen." }, { status: 400 });
  }

  if (pago.comprobante_path) {
    await eliminarImagen(pago.comprobante_path);
  }

  await db("payments").where({ id: pagoId }).update({ comprobante_path: ruta });

  const cliente = await db("users").where({ id: sesion.userId }).first();
  await crearNotificacion({
    userId: pago.trainer_id,
    tipo: "pago",
    titulo: `Comprobante subido: ${pago.concepto}`,
    subtitulo: `${cliente.nombre} ${cliente.apellido} envió un comprobante de pago.`,
    link: `/entrenador/clientes/${sesion.userId}`,
  });

  return NextResponse.json({ message: "Comprobante enviado. Tu entrenador confirmará tu pago pronto." });
}
