import type { Knex } from "knex";

const GOALS = [
  { key: "masa", label: "Aumento de masa muscular", short_label: "Masa muscular", color: "#7c3aed" },
  { key: "grasa", label: "Disminución de grasa corporal", short_label: "Pérdida de grasa", color: "#ef4444" },
  { key: "mantenimiento", label: "Mantenimiento y tonificación", short_label: "Mantenimiento", color: "#0ea5e9" },
  { key: "rendimiento", label: "Rendimiento deportivo", short_label: "Rendimiento", color: "#f59e0b" },
];

export async function seed(knex: Knex): Promise<void> {
  for (const goal of GOALS) {
    const existente = await knex("goals").where({ key: goal.key }).first();
    if (!existente) {
      await knex("goals").insert(goal);
    }
  }
}
