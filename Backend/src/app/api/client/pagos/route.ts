import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const pagos = await db("payments")
    .leftJoin("users as trainer", "trainer.id", "payments.trainer_id")
    .where({ client_id: sesion.userId })
    .orderBy("fecha", "desc")
    .select(
      "payments.id",
      "payments.monto",
      "payments.concepto",
      "payments.fecha",
      "payments.estado",
      "payments.comprobante_path",
      "trainer.nombre as trainer_nombre",
      "trainer.apellido as trainer_apellido"
    );

  return NextResponse.json({ pagos });
}
