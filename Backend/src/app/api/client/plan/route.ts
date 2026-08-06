import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenerSesion } from "@/lib/auth";
import { parsearJson } from "@/lib/json";
import { calcularSalud, libraAKg, piesAcm } from "@/lib/salud";

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

  const pesoKg = usuario.peso ? (usuario.peso_unidad === "lb" ? libraAKg(Number(usuario.peso)) : Number(usuario.peso)) : null;
  const alturaCm = usuario.altura ? (usuario.altura_unidad === "ft" ? piesAcm(Number(usuario.altura)) : Number(usuario.altura)) : null;

  const salud = calcularSalud({
    pesoKg,
    alturaCm,
    edad: usuario.edad,
    sexo: usuario.sexo,
    nivelActividad: usuario.nivel_actividad,
    cintura: usuario.cintura ? Number(usuario.cintura) : null,
    cadera: usuario.cadera ? Number(usuario.cadera) : null,
    presionSistolica: usuario.presion_sistolica,
    presionDiastolica: usuario.presion_diastolica,
    goalKey: usuario.goal_key,
    porcentajeGrasa: usuario.porcentaje_grasa ? Number(usuario.porcentaje_grasa) : null,
    porcentajeMasaMuscular: usuario.porcentaje_masa_muscular ? Number(usuario.porcentaje_masa_muscular) : null,
  });

  return NextResponse.json({
    asignado: true,
    plan: plan
      ? {
          key: plan.key,
          name: plan.name,
          price: plan.price,
          includesDiet: !!plan.includes_diet,
          description: plan.description,
          beneficios: plan.beneficios ? parsearJson<string[]>(plan.beneficios) : [],
        }
      : null,
    goal: goal ? { key: goal.key, label: goal.label, shortLabel: goal.short_label, color: goal.color } : null,
    rutina: rutina ? parsearJson(rutina.contenido) : [],
    dieta: plan?.includes_diet && dieta ? { nota: dieta.nota, comidas: parsearJson(dieta.comidas) } : null,
    caloriasObjetivo: salud.caloriasObjetivo,
    proteinaObjetivoG: salud.proteinaObjetivoG,
  });
}
