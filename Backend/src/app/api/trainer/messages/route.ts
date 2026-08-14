import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = await obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientes = await db("users").where({ trainer_id: sesion.userId }).select("id", "nombre", "apellido");

  const resultado = await Promise.all(
    clientes.map(async (cliente) => {
      const noLeidos = await db("messages")
        .where({ client_id: cliente.id, remitente: "cliente", leido: false })
        .count("id as total")
        .first<{ total: number } | undefined>();

      const ultimo = await db("messages")
        .where({ client_id: cliente.id })
        .orderBy("created_at", "desc")
        .first();

      return {
        id: cliente.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        noLeidos: Number(noLeidos?.total ?? 0),
        ultimoMensaje: ultimo?.texto ?? null,
      };
    }),
  );

  return NextResponse.json({ clientes: resultado });
}
