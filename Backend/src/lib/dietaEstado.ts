import { db } from "@/lib/db";
import { parsearJson } from "@/lib/json";

interface Comida {
  meal: string;
}

export interface AdherenciaDieta {
  totalEsperadas: number;
  completadas: number;
  porcentaje: number;
}

export async function obtenerComidasAsignadas(userId: number): Promise<Comida[]> {
  const usuario = await db("users").where({ id: userId }).first();
  if (!usuario?.plan_key || !usuario.goal_key) {
    return [];
  }

  const plan = await db("plans").where({ key: usuario.plan_key }).first();
  if (!plan?.includes_diet) {
    return [];
  }

  const dietaCustom = await db("custom_diets").where({ user_id: userId }).first();
  const dietaDefault = dietaCustom ? null : await db("default_diets").where({ goal_key: usuario.goal_key }).first();
  const dieta = dietaCustom ?? dietaDefault;

  return dieta ? parsearJson<Comida[]>(dieta.comidas) : [];
}

export async function obtenerAdherenciaSemanaDieta(userId: number): Promise<AdherenciaDieta> {
  const comidas = await obtenerComidasAsignadas(userId);

  if (comidas.length === 0) {
    return { totalEsperadas: 0, completadas: 0, porcentaje: 0 };
  }

  const sieteDiasAtras = new Date();
  sieteDiasAtras.setDate(sieteDiasAtras.getDate() - 6);

  const resultado = await db("diet_completions")
    .where({ user_id: userId })
    .andWhere("fecha", ">=", sieteDiasAtras.toISOString().slice(0, 10))
    .count("id as total")
    .first<{ total: number } | undefined>();

  const completadas = Number(resultado?.total ?? 0);
  const totalEsperadas = comidas.length * 7;

  return { totalEsperadas, completadas, porcentaje: Math.round((completadas / totalEsperadas) * 100) };
}
