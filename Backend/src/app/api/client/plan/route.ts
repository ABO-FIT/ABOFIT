import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { parsearJson } from "@/lib/json";

export async function GET(request: Request) {
  const sesion = obtenerSesion(request);
  if (!sesion || sesion.rol !== "Cliente") {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const usuario = await db("users").where({ id: sesion.userId }).first();

  if (!usuario.plan_key || !usuario.goal_key) {
    return NextResponse.json({ asignado: false });
  }

  const [plan, goal, rutinaCustom, rutinaDefault, dietaCustom, dietaDefault] = await Promise.all([
    db("plans").where({ key: usuario.plan_key }).first(),
    db("goals").where({ key: usuario.goal_key }).first(),
    db("custom_routines").where({ user_id: sesion.userId }).first(),
    db("default_routines").where({ goal_key: usuario.goal_key }).first(),
    db("custom_diets").where({ user_id: sesion.userId }).first(),
    db("default_diets").where({ goal_key: usuario.goal_key }).first(),
  ]);

  const rutina = rutinaCustom ?? rutinaDefault;
  const dieta = dietaCustom ?? dietaDefault;

  return NextResponse.json({
    asignado: true,
    plan: plan
      ? { key: plan.key, name: plan.name, price: plan.price, includesDiet: !!plan.includes_diet, description: plan.description }
      : null,
    goal: goal ? { key: goal.key, label: goal.label, shortLabel: goal.short_label, color: goal.color } : null,
    rutina: rutina ? parsearJson(rutina.contenido) : [],
    dieta: plan?.includes_diet && dieta ? { nota: dieta.nota, comidas: parsearJson(dieta.comidas) } : null,
  });
}
