import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { obtenerPorcentajeSemana } from "@/lib/rutinaEstado";

const PLANES_VALIDOS = ["A", "B"];
const OBJETIVOS_VALIDOS = ["masa", "grasa", "mantenimiento", "rendimiento"];

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const clientesBase = await db("users")
    .where({ trainer_id: sesion.userId })
    .select("id", "nombre", "apellido", "usuario", "correo", "plan_key", "goal_key");

  const clientes = await Promise.all(
    clientesBase.map(async (cliente) => {
      const [ultimoProgreso, porcentajeSemana] = await Promise.all([
        db("progress_entries").where({ user_id: cliente.id }).orderBy("fecha", "desc").first("fecha"),
        obtenerPorcentajeSemana(cliente.id, cliente.goal_key),
      ]);

      return {
        ...cliente,
        ultimaFechaProgreso: ultimoProgreso?.fecha ?? null,
        porcentajeSemana,
      };
    })
  );

  return NextResponse.json({ clientes });
}

export async function POST(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Entrenador") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const { usuario, planKey, goalKey } = body as Record<string, unknown>;

  if (typeof usuario !== "string" || !usuario.trim()) {
    return NextResponse.json({ error: "El usuario del cliente es obligatorio." }, { status: 400 });
  }

  if (typeof planKey !== "string" || !PLANES_VALIDOS.includes(planKey)) {
    return NextResponse.json({ error: "El plan debe ser A o B." }, { status: 400 });
  }

  if (typeof goalKey !== "string" || !OBJETIVOS_VALIDOS.includes(goalKey)) {
    return NextResponse.json({ error: "El objetivo indicado no es válido." }, { status: 400 });
  }

  const cliente = await db("users")
    .join("roles", "roles.id", "users.rol_id")
    .where("users.usuario", usuario.trim())
    .andWhere("roles.nombre", "Cliente")
    .select("users.id", "users.trainer_id")
    .first();

  if (!cliente) {
    return NextResponse.json({ error: "No existe un cliente con ese usuario." }, { status: 404 });
  }

  if (cliente.trainer_id && cliente.trainer_id !== sesion.userId) {
    return NextResponse.json({ error: "Ese cliente ya tiene un entrenador asignado." }, { status: 409 });
  }

  await db("users")
    .where({ id: cliente.id })
    .update({
      trainer_id: sesion.userId,
      plan_key: planKey,
      goal_key: goalKey,
      fecha_inicio: new Date().toISOString().slice(0, 10),
    });

  return NextResponse.json({ message: "Cliente asignado correctamente." });
}
