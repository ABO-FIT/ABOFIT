import type { Knex } from "knex";

const PLANS = [
  {
    key: "A",
    name: "Plan A — Entrenamiento",
    price: 8000,
    includes_diet: false,
    description: "Rutina de entrenamiento personalizada con seguimiento semanal.",
  },
  {
    key: "B",
    name: "Plan B — Entrenamiento + Dieta",
    price: 10000,
    includes_diet: true,
    description: "Rutina personalizada más plan de alimentación y seguimiento completo.",
  },
];

export async function seed(knex: Knex): Promise<void> {
  for (const plan of PLANS) {
    const existente = await knex("plans").where({ key: plan.key }).first();
    if (!existente) {
      await knex("plans").insert(plan);
    }
  }
}
