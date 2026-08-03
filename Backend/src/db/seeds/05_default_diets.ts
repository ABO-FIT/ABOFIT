import type { Knex } from "knex";

const DIETS: Record<string, { note: string; meals: { meal: string; items: string }[] }> = {
  masa: {
    note: "Superávit calórico (~+400 kcal) · alta en proteína y carbohidratos para ganar masa.",
    meals: [
      { meal: "Desayuno", items: "Avena 80g + 3 huevos + 2 claras + 1 banana" },
      { meal: "Media mañana", items: "Batido de proteína + 40g maní + pan integral" },
      { meal: "Almuerzo", items: "Pollo o res 200g + arroz 120g + vegetales + aguacate" },
      { meal: "Merienda", items: "Batata 150g + atún + frutos secos" },
      { meal: "Cena", items: "Carne o pescado 200g + arroz 80g + ensalada" },
    ],
  },
  grasa: {
    note: "Déficit calórico (~-400 kcal) · alta en proteína para conservar músculo.",
    meals: [
      { meal: "Desayuno", items: "4 claras + 1 huevo + avena 40g + 1 fruta" },
      { meal: "Media mañana", items: "Yogur griego 0% + almendras (15g)" },
      { meal: "Almuerzo", items: "Pechuga 180g + ensalada grande + arroz integral 60g" },
      { meal: "Merienda", items: "Batido de proteína + 1 fruta" },
      { meal: "Cena", items: "Pescado 180g + vegetales al vapor + poco aguacate" },
    ],
  },
  mantenimiento: {
    note: "Calorías de mantenimiento · macros balanceados para sostener composición corporal.",
    meals: [
      { meal: "Desayuno", items: "Avena 50g + 2 huevos + 1 fruta" },
      { meal: "Media mañana", items: "Yogur + frutos secos (20g)" },
      { meal: "Almuerzo", items: "Pollo 150g + arroz 80g + vegetales + aguacate" },
      { meal: "Merienda", items: "Tostadas integrales + atún + ensalada" },
      { meal: "Cena", items: "Pescado o pollo 150g + vegetales + 1 porción de carbohidrato" },
    ],
  },
  rendimiento: {
    note: "Alta en carbohidratos complejos y proteína · sincronizada con entrenos para optimizar rendimiento.",
    meals: [
      { meal: "Desayuno", items: "Avena 100g + 3 huevos + banana + miel" },
      { meal: "Pre-entreno", items: "Tostadas + miel + café + batido de proteína" },
      { meal: "Post-entreno", items: "Batido whey + dextrosa + creatina" },
      { meal: "Almuerzo", items: "Carne magra 220g + pasta o arroz 150g + vegetales" },
      { meal: "Merienda", items: "Batata 200g + pollo 120g" },
      { meal: "Cena", items: "Pescado 200g + quinoa 100g + ensalada + aguacate" },
    ],
  },
};

export async function seed(knex: Knex): Promise<void> {
  for (const [goalKey, dieta] of Object.entries(DIETS)) {
    const existente = await knex("default_diets").where({ goal_key: goalKey }).first();
    if (!existente) {
      await knex("default_diets").insert({
        goal_key: goalKey,
        nota: dieta.note,
        comidas: JSON.stringify(dieta.meals),
      });
    }
  }
}
