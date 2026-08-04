import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientes = await db("users")
    .where({ trainer_id: sesion.userId })
    .select("id", "nombre", "apellido", "goal_key");

  const totalClientes = clientes.length;

  const distribucionPorObjetivo: Record<string, number> = {};
  for (const cliente of clientes) {
    const clave = cliente.goal_key ?? "sin_asignar";
    distribucionPorObjetivo[clave] = (distribucionPorObjetivo[clave] ?? 0) + 1;
  }

  const goals = await db("goals").select("key", "label");
  const distribucion = Object.entries(distribucionPorObjetivo).map(([key, total]) => ({
    goalKey: key,
    goalLabel: goals.find((g) => g.key === key)?.label ?? "Sin objetivo",
    total,
  }));

  const evoluciones = [];
  for (const cliente of clientes) {
    const entradas = await db("progress_entries")
      .where({ user_id: cliente.id })
      .whereNotNull("peso")
      .orderBy("fecha", "asc")
      .select("peso", "fecha");

    if (entradas.length >= 2) {
      const pesoInicial = Number(entradas[0].peso);
      const pesoActual = Number(entradas[entradas.length - 1].peso);
      evoluciones.push({
        clienteId: cliente.id,
        nombre: `${cliente.nombre} ${cliente.apellido}`,
        pesoInicial,
        pesoActual,
        cambioPeso: Number((pesoActual - pesoInicial).toFixed(2)),
        registros: entradas.length,
      });
    }
  }

  const cambioPromedioPeso =
    evoluciones.length > 0
      ? Number((evoluciones.reduce((suma, e) => suma + e.cambioPeso, 0) / evoluciones.length).toFixed(2))
      : null;

  const topEvolucion = [...evoluciones].sort((a, b) => Math.abs(b.cambioPeso) - Math.abs(a.cambioPeso)).slice(0, 5);

  const clientesActivos =
    totalClientes === 0
      ? 0
      : await db("progress_entries")
          .distinct("user_id")
          .whereIn(
            "user_id",
            clientes.map((c) => c.id)
          )
          .andWhere("fecha", ">=", new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10))
          .then((r) => r.length);

  return NextResponse.json({
    totalClientes,
    clientesActivos,
    distribucion,
    cambioPromedioPeso,
    topEvolucion,
  });
}
