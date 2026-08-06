import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { obtenerOCrearPagoPendiente } from "@/lib/pagosPlan";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const cliente = await db("users").where({ id: sesion.userId }).first();
  if (!cliente?.trainer_id) {
    return NextResponse.json({ error: "Aún no tienes un entrenador asignado." }, { status: 400 });
  }

  const resultado = await obtenerOCrearPagoPendiente(sesion.userId);
  if (!resultado) {
    return NextResponse.json({ error: "Aún no tienes un plan asignado." }, { status: 400 });
  }

  const entrenador = await db("users")
    .where({ id: cliente.trainer_id })
    .select("nombre", "apellido", "bank_name", "bank_account", "bank_holder", "pay_phone")
    .first();

  return NextResponse.json({
    ...resultado,
    entrenador: entrenador
      ? {
          nombre: entrenador.nombre,
          apellido: entrenador.apellido,
          bankName: entrenador.bank_name,
          bankAccount: entrenador.bank_account,
          bankHolder: entrenador.bank_holder,
          payPhone: entrenador.pay_phone,
        }
      : null,
  });
}
