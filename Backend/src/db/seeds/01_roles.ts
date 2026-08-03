import type { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  const roles = ["Administrador", "Entrenador", "Cliente"];

  for (const nombre of roles) {
    const existente = await knex("roles").where({ nombre }).first();
    if (!existente) {
      await knex("roles").insert({ nombre });
    }
  }
}
